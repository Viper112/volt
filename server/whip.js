import express from 'express'
import crypto from 'crypto'
import { createRequire } from 'module'
import { rtcConfig } from './ice.js'

const require = createRequire(import.meta.url)

let wrtc
try {
  wrtc = require('@roamhq/wrtc')
} catch (err) {
  console.error('WebRTC native module failed to load:', err?.message || err)
}

const sessions = new Map()

function waitIce(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 2500)
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(t)
        resolve()
      }
    }
  })
}

export function createWhipHub({ io, getUserByKey, onPublish, onUnpublish }) {
  if (!wrtc) {
    return {
      enabled: false,
      hasPublisher: () => false,
      attach() {},
      addViewer() {},
      removeViewer() {},
      handleAnswer() {},
      handleIce() {},
    }
  }

  const { RTCPeerConnection, MediaStream } = wrtc

  function stopSession(key, reason) {
    const session = sessions.get(key)
    if (!session) return
    sessions.delete(key)
    session.viewers.forEach((pc) => {
      try {
        pc.close()
      } catch {
        /* ignore */
      }
    })
    try {
      session.pc.close()
    } catch {
      /* ignore */
    }
    onUnpublish(session.user, reason)
  }

  async function ingest(rawSdp, streamKey) {
    const user = getUserByKey(streamKey)
    if (!user) {
      const err = new Error('Invalid stream key')
      err.status = 401
      throw err
    }

    const existing = [...sessions.values()].find((s) => s.user.username === user.username)
    if (existing) stopSession(existing.key)

    const pc = new RTCPeerConnection(rtcConfig)
    const stream = new MediaStream()
    const session = {
      id: crypto.randomBytes(8).toString('hex'),
      key: streamKey,
      user,
      pc,
      stream,
      viewers: new Map(),
      live: false,
    }

    pc.ontrack = (ev) => {
      const track = ev.track
      if (track) stream.addTrack(track)
      if (!session.live) {
        session.live = true
        onPublish(user)
      }
    }
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'failed' || state === 'closed') {
        stopSession(streamKey)
      }
    }

    sessions.set(streamKey, session)
    await pc.setRemoteDescription({ type: 'offer', sdp: rawSdp })
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await waitIce(pc)
    return { session, sdp: pc.localDescription?.sdp || answer.sdp }
  }

  async function addViewer(username, viewerId) {
    const session = [...sessions.values()].find((s) => s.user.username === username)
    if (!session) return false
    if (!session.stream.getTracks().length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
    const prev = session.viewers.get(viewerId)
    if (prev) {
      try {
        prev.close()
      } catch {
        /* ignore */
      }
    }
    const pc = new RTCPeerConnection(rtcConfig)
    session.stream.getTracks().forEach((track) => pc.addTrack(track, session.stream))
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        io.to(viewerId).emit('webrtc:ice', {
          from: `sfu:${username}`,
          candidate: ev.candidate,
        })
      }
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    session.viewers.set(viewerId, pc)
    io.to(viewerId).emit('webrtc:offer', { from: `sfu:${username}`, sdp: pc.localDescription || offer })
    return true
  }

  function removeViewer(username, viewerId) {
    const session = [...sessions.values()].find((s) => s.user.username === username)
    const pc = session?.viewers.get(viewerId)
    if (!pc) return
    session.viewers.delete(viewerId)
    try {
      pc.close()
    } catch {
      /* ignore */
    }
  }

  async function handleAnswer(username, viewerId, sdp) {
    const session = [...sessions.values()].find((s) => s.user.username === username)
    const pc = session?.viewers.get(viewerId)
    if (!pc || !sdp) return
    await pc.setRemoteDescription(sdp)
  }

  async function handleIce(username, viewerId, candidate) {
    const session = [...sessions.values()].find((s) => s.user.username === username)
    const pc = session?.viewers.get(viewerId)
    if (!pc || !candidate) return
    await pc.addIceCandidate(candidate)
  }

  function attach(app) {
    const sdpParser = express.text({ type: '*/*', limit: '2mb' })

    const post = async (req, res) => {
      const header = String(req.headers.authorization || '')
      const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
      const key = bearer || String(req.params.key || '').trim()
      try {
        const { session, sdp } = await ingest(String(req.body || ''), key)
        res.setHeader('Content-Type', 'application/sdp')
        res.setHeader('Location', `/api/whip/${encodeURIComponent(session.key)}`)
        res.status(201).send(sdp)
      } catch (err) {
        res.status(err.status || 400).json({ error: err.message || 'WHIP ingest failed' })
      }
    }

    app.post('/api/whip', sdpParser, post)
    app.post('/api/whip/:key', sdpParser, post)
    app.delete('/api/whip/:key', (req, res) => {
      const key = String(req.params.key || '')
      stopSession(key)
      res.status(204).end()
    })
  }

  return {
    enabled: true,
    hasPublisher: (username) => [...sessions.values()].some((s) => s.user.username === username),
    attach,
    addViewer,
    removeViewer,
    handleAnswer,
    handleIce,
  }
}

import express from 'express'
import crypto from 'crypto'
import { createRequire } from 'module'
import { iceServers, rtcConfig } from './ice.js'

const require = createRequire(import.meta.url)

let wrtc
try {
  wrtc = require('@roamhq/wrtc')
} catch (err) {
  console.error('WebRTC native module failed to load:', err?.message || err)
}

const sessions = new Map()
const sessionsByKey = new Map()

function originOf(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim()
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
  return `${proto}://${host}`
}

function iceLinkHeaders() {
  const links = ['<stun:stun.l.google.com:19302>; rel="ice-server"']
  for (const server of iceServers()) {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls]
    for (const url of urls) {
      let link = `<${url}>; rel="ice-server"`
      if (server.username) link += `; username="${server.username}"`
      if (server.credential) {
        link += `; credential="${server.credential}"; credential-type="password"`
      }
      links.push(link)
    }
  }
  return links
}

function applyIceHeaders(res) {
  for (const link of iceLinkHeaders()) res.append('Link', link)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Accept-Post', 'application/sdp')
}

function waitIce(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 1800)
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(t)
        resolve()
      }
    }
  })
}

function trickleToCandidates(body) {
  const mid = (String(body).match(/^a=mid:(\S+)/m) || [])[1] || '0'
  return [...String(body).matchAll(/^a=candidate:(.+)$/gm)].map((m) => ({
    candidate: `candidate:${m[1]}`,
    sdpMid: mid,
  }))
}

export function createWhipHub({ io, getUserByKey, onPublish, onUnpublish }) {
  function stopSession(session) {
    if (!session) return
    sessions.delete(session.id)
    if (sessionsByKey.get(session.key) === session) sessionsByKey.delete(session.key)
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
    onUnpublish(session.user)
  }

  function findByUsername(username) {
    return [...sessions.values()].find((s) => s.user.username === username) || null
  }

  async function ingest(rawSdp, streamKey) {
    if (!wrtc) {
      const err = new Error('WHIP is not available on this host')
      err.status = 503
      throw err
    }
    const sdp = String(rawSdp || '').trim()
    if (!sdp.includes('v=')) {
      const err = new Error('Expected an SDP offer from OBS (Service must be WHIP, not Custom)')
      err.status = 400
      throw err
    }
    const user = getUserByKey(streamKey)
    if (!user) {
      const err = new Error('Invalid stream key')
      err.status = 401
      throw err
    }

    const existing = findByUsername(user.username)
    if (existing) stopSession(existing)

    const { RTCPeerConnection, MediaStream } = wrtc
    const pc = new RTCPeerConnection(rtcConfig)
    const stream = new MediaStream()
    const session = {
      id: crypto.randomBytes(12).toString('hex'),
      key: streamKey,
      user,
      pc,
      stream,
      viewers: new Map(),
      live: false,
    }

    try {
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })
    } catch {
      /* older wrtc */
    }

    pc.ontrack = (ev) => {
      if (ev.track) stream.addTrack(ev.track)
      if (!session.live) {
        session.live = true
        onPublish(user)
      }
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') stopSession(session)
    }

    sessions.set(session.id, session)
    sessionsByKey.set(streamKey, session)
    await pc.setRemoteDescription({ type: 'offer', sdp })
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await waitIce(pc)
    return { session, sdp: pc.localDescription?.sdp || answer.sdp }
  }

  async function addViewer(username, viewerId) {
    if (!wrtc) return false
    const session = findByUsername(username)
    if (!session) return false
    if (!session.stream.getTracks().length) await new Promise((r) => setTimeout(r, 1200))
    const prev = session.viewers.get(viewerId)
    if (prev) {
      try {
        prev.close()
      } catch {
        /* ignore */
      }
    }
    const { RTCPeerConnection } = wrtc
    const pc = new RTCPeerConnection(rtcConfig)
    session.stream.getTracks().forEach((track) => pc.addTrack(track, session.stream))
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        io.to(viewerId).emit('webrtc:ice', { from: `sfu:${username}`, candidate: ev.candidate })
      }
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    session.viewers.set(viewerId, pc)
    io.to(viewerId).emit('webrtc:offer', { from: `sfu:${username}`, sdp: pc.localDescription || offer })
    return true
  }

  function removeViewer(username, viewerId) {
    const session = findByUsername(username)
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
    const pc = findByUsername(username)?.viewers.get(viewerId)
    if (!pc || !sdp) return
    await pc.setRemoteDescription(sdp)
  }

  async function handleIce(username, viewerId, candidate) {
    const pc = findByUsername(username)?.viewers.get(viewerId)
    if (!pc || !candidate) return
    await pc.addIceCandidate(candidate)
  }

  function attach(app) {
    const sdpParser = express.text({ type: '*/*', limit: '2mb' })

    const options = (req, res) => {
      applyIceHeaders(res)
      res.status(204).end()
    }

    const post = async (req, res) => {
      applyIceHeaders(res)
      const header = String(req.headers.authorization || '')
      const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim()
      const key = decodeURIComponent(bearer || String(req.params.key || '')).trim()
      try {
        const { session, sdp } = await ingest(req.body, key)
        res.setHeader('Content-Type', 'application/sdp')
        res.setHeader('Location', `${originOf(req)}/api/whip/session/${session.id}`)
        res.setHeader('ETag', `"${session.id}"`)
        res.status(201).send(sdp)
      } catch (err) {
        console.error('WHIP ingest error:', err?.message || err)
        res.status(err.status || 400).type('text/plain').send(err.message || 'WHIP ingest failed')
      }
    }

    app.options('/api/whip', options)
    app.options('/api/whip/:key', options)
    app.get('/api/whip', (req, res) => {
      applyIceHeaders(res)
      res.json({ whip: true, wrtc: Boolean(wrtc) })
    })
    app.post('/api/whip', sdpParser, post)
    app.post('/api/whip/:key', sdpParser, post)
    app.patch('/api/whip/session/:id', sdpParser, async (req, res) => {
      const session = sessions.get(String(req.params.id || ''))
      if (!session) return res.status(404).end()
      try {
        for (const c of trickleToCandidates(req.body)) {
          await session.pc.addIceCandidate(c)
        }
        res.status(204).end()
      } catch (err) {
        res.status(400).type('text/plain').send(err.message || 'PATCH failed')
      }
    })
    app.delete('/api/whip/session/:id', (req, res) => {
      stopSession(sessions.get(String(req.params.id || '')))
      res.status(204).end()
    })
    app.delete('/api/whip/:key', (req, res) => {
      stopSession(sessionsByKey.get(decodeURIComponent(String(req.params.key || ''))))
      res.status(204).end()
    })
  }

  return {
    enabled: Boolean(wrtc),
    hasPublisher: (username) => Boolean(findByUsername(username)),
    attach,
    addViewer,
    removeViewer,
    handleAnswer,
    handleIce,
  }
}

import express from 'express'
import cors from 'cors'
import http from 'http'
import crypto from 'crypto'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { startRtmpServer } from './media.js'
import { createWhipHub } from './whip.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'volt-dev-secret'
const USERS_FILE = path.join(__dirname, 'users.json')
const RTMP_PORT = process.env.RTMP_PORT || 1935
const NMS_HTTP_PORT = process.env.NMS_HTTP_PORT || 8000

const ingestMeta = new Map()

function makeStreamKey() {
  return crypto.randomBytes(18).toString('base64url')
}

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

let users = loadUsers()
if (!users.find((u) => u.username === 'demo')) {
  users.push({
    id: 'demo',
    username: 'demo',
    displayName: 'Demo',
    passwordHash: bcrypt.hashSync('demo123', 8),
    following: ['nova', 'luna', 'kira'],
    streamKey: makeStreamKey(),
  })
  saveUsers(users)
}
let changedKeys = false
for (const u of users) {
  if (!u.streamKey) {
    u.streamKey = makeStreamKey()
    changedKeys = true
  }
}
if (changedKeys) saveUsers(users)

const liveStreams = new Map()
const hostSockets = new Map()

function authUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return users.find((u) => u.id === payload.id) || null
  } catch {
    return null
  }
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    following: u.following,
  }
}

function liveList() {
  return [...liveStreams.values()]
}

function broadcastLive() {
  io.emit('live:update', { streams: liveList() })
}

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body.username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
  const password = String(req.body.password || '')
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' })
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  if (users.find((u) => u.username === username)) return res.status(400).json({ error: 'Username is taken.' })
  const user = {
    id: `${Date.now()}`,
    username,
    displayName: username,
    passwordHash: bcrypt.hashSync(password, 8),
    following: [],
    streamKey: makeStreamKey(),
  }
  users.push(user)
  saveUsers(users)
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '14d' })
  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const user = users.find((u) => u.username === username)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password.' })
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '14d' })
  res.json({ token, user: publicUser(user) })
})

app.get('/api/me', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  res.json({ user: publicUser(user) })
})

app.post('/api/follow/:username', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const name = String(req.params.username).toLowerCase()
  if (name === user.username) return res.status(400).json({ error: 'You cannot follow yourself.' })
  if (!user.following.includes(name)) user.following.push(name)
  saveUsers(users)
  res.json({ following: user.following })
})

app.delete('/api/follow/:username', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const name = String(req.params.username).toLowerCase()
  user.following = user.following.filter((u) => u !== name)
  saveUsers(users)
  res.json({ following: user.following })
})

app.get('/api/live', (_req, res) => {
  res.json({ streams: liveList() })
})

function publicHost(req) {
  if (process.env.PUBLIC_HOST) return process.env.PUBLIC_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (process.env.RENDER_EXTERNAL_HOSTNAME) return process.env.RENDER_EXTERNAL_HOSTNAME
  const xf = req.headers['x-forwarded-host']
  if (xf) return String(xf).split(',')[0].trim()
  return String(req.headers.host || req.get?.('host') || 'localhost:3001')
}

function publicProto(req) {
  if (process.env.RENDER_EXTERNAL_HOSTNAME || process.env.NODE_ENV === 'production') return 'https'
  const xf = String(req.headers['x-forwarded-proto'] || '')
  if (xf) return xf.split(',')[0].trim()
  return req.protocol || 'http'
}

function ingestPayload(req, user) {
  const origin = `${publicProto(req)}://${publicHost(req)}`
  return {
    whipUrl: `${origin}/api/whip/${encodeURIComponent(user.streamKey)}`,
    rtmpUrl: `${origin}/api/whip/${encodeURIComponent(user.streamKey)}`,
    streamKey: user.streamKey,
    playbackUrl: `/playback/${user.username}.flv`,
    title: ingestMeta.get(user.username)?.title || 'Live on VOLT',
    category: ingestMeta.get(user.username)?.category || 'just-chatting',
    live: ['rtmp', 'whip'].includes(liveStreams.get(user.username)?.source),
  }
}

app.get('/api/ingest', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  if (!user.streamKey) {
    user.streamKey = makeStreamKey()
    saveUsers(users)
  }
  res.json(ingestPayload(req, user))
})

app.post('/api/ingest', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const title = String(req.body.title || 'Live on VOLT').slice(0, 140)
  const category = String(req.body.category || 'just-chatting')
  ingestMeta.set(user.username, { title, category })
  const current = liveStreams.get(user.username)
  if (current?.source === 'rtmp') {
    liveStreams.set(user.username, { ...current, title, category })
    broadcastLive()
  }
  res.json(ingestPayload(req, user))
})

app.post('/api/ingest/rotate', (req, res) => {
  const user = authUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  user.streamKey = makeStreamKey()
  saveUsers(users)
  res.json(ingestPayload(req, user))
})

app.get('/playback/:file', (req, res) => {
  const match = String(req.params.file || '').match(/^([a-z0-9_]+)\.flv$/i)
  if (!match) return res.status(404).end()
  const username = match[1].toLowerCase()
  const user = users.find((u) => u.username === username)
  const stream = liveStreams.get(username)
  if (!user?.streamKey || stream?.source !== 'rtmp') return res.status(404).end()
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: NMS_HTTP_PORT,
      path: `/live/${user.streamKey}.flv`,
      method: 'GET',
      headers: { connection: 'keep-alive' },
    },
    (up) => {
      res.writeHead(up.statusCode || 200, {
        'Content-Type': 'video/x-flv',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      })
      up.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).end()
    else res.end()
  })
  req.on('close', () => upstream.destroy())
  upstream.end()
})

function setRtmpLive(user) {
  const meta = ingestMeta.get(user.username) || {}
  liveStreams.set(user.username, {
    id: `live-${user.username}`,
    username: user.username,
    title: meta.title || 'Live on VOLT',
    category: meta.category || 'just-chatting',
    language: 'English',
    mature: false,
    viewers: liveStreams.get(user.username)?.viewers || 0,
    thumbnail: '',
    videoUrl: `/playback/${user.username}.flv`,
    tags: ['English', 'OBS'],
    featured: true,
    source: 'rtmp',
  })
  broadcastLive()
}

function endRtmpLive(user) {
  const current = liveStreams.get(user.username)
  if (current?.source !== 'rtmp') return
  liveStreams.delete(user.username)
  io.to(`watch:${user.username}`).emit('live:ended')
  broadcastLive()
}

function setWhipLive(user) {
  const meta = ingestMeta.get(user.username) || {}
  liveStreams.set(user.username, {
    id: `live-${user.username}`,
    username: user.username,
    title: meta.title || 'Live on VOLT',
    category: meta.category || 'just-chatting',
    language: 'English',
    mature: false,
    viewers: liveStreams.get(user.username)?.viewers || 0,
    thumbnail: '',
    videoUrl: '',
    tags: ['English', 'OBS'],
    featured: true,
    source: 'whip',
  })
  broadcastLive()
}

function endWhipLive(user) {
  const current = liveStreams.get(user.username)
  if (!current || current.source !== 'whip') return
  if (hostSockets.has(user.username)) return
  liveStreams.delete(user.username)
  io.to(`watch:${user.username}`).emit('live:ended')
  broadcastLive()
}

const whip = createWhipHub({
  io,
  getUserByKey: (key) => users.find((u) => u.streamKey && u.streamKey === key) || null,
  onPublish: setWhipLive,
  onUnpublish: endWhipLive,
})
whip.attach(app)

try {
  startRtmpServer({
    rtmpPort: RTMP_PORT,
    httpPort: NMS_HTTP_PORT,
    getUserByKey: (key) => users.find((u) => u.streamKey && u.streamKey === key) || null,
    onPublish: setRtmpLive,
    onUnpublish: endRtmpLive,
  })
  console.log(`RTMP ingest on rtmp://0.0.0.0:${RTMP_PORT}/live`)
} catch (err) {
  console.error('RTMP server failed to start:', err)
}

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

io.on('connection', (socket) => {
  socket.on('chat:join', (slug) => {
    if (!slug) return
    socket.join(`chat:${String(slug).toLowerCase()}`)
  })

  socket.on('chat:leave', (slug) => {
    if (!slug) return
    socket.leave(`chat:${String(slug).toLowerCase()}`)
  })

  socket.on('chat:send', (payload) => {
    const slug = String(payload?.slug || '').toLowerCase()
    const text = String(payload?.text || '').trim().slice(0, 240)
    const username = String(payload?.username || 'anon').slice(0, 24)
    if (!slug || !text) return
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      username,
      text,
      ts: Date.now(),
      color: payload?.color || '#69db7c',
    }
    io.to(`chat:${slug}`).emit('chat:message', message)
  })

  socket.on('live:start', (payload) => {
    const username = String(payload?.username || '').toLowerCase()
    if (!username) return
    const stream = {
      id: `live-${username}`,
      username,
      title: String(payload?.title || 'Live now').slice(0, 140),
      category: String(payload?.category || 'just-chatting'),
      language: String(payload?.language || 'English'),
      mature: !!payload?.mature,
      viewers: 0,
      thumbnail: '',
      videoUrl: '',
      tags: payload?.tags || ['English'],
      featured: true,
      source: 'webrtc',
    }
    liveStreams.set(username, stream)
    hostSockets.set(username, socket.id)
    socket.data.liveUsername = username
    socket.join(`watch:${username}`)
    broadcastLive()
  })

  socket.on('live:update-meta', (payload) => {
    const username = socket.data.liveUsername
    if (!username || !liveStreams.has(username)) return
    const current = liveStreams.get(username)
    liveStreams.set(username, {
      ...current,
      title: payload?.title ?? current.title,
      category: payload?.category ?? current.category,
    })
    broadcastLive()
  })

  socket.on('watch:join', (usernameRaw) => {
    const username = String(usernameRaw || '').toLowerCase()
    socket.data.watching = username
    socket.join(`watch:${username}`)
    const stream = liveStreams.get(username)
    if (stream) {
      stream.viewers += 1
      liveStreams.set(username, stream)
      broadcastLive()
    }
    const hostId = hostSockets.get(username)
    if (whip.hasPublisher(username)) {
      whip.addViewer(username, socket.id).catch(() => {})
    } else if (hostId) {
      io.to(hostId).emit('viewer:joined', { viewerId: socket.id })
    }
  })

  socket.on('watch:leave', () => {
    const username = socket.data.watching
    if (!username) return
    socket.leave(`watch:${username}`)
    const stream = liveStreams.get(username)
    if (stream) {
      stream.viewers = Math.max(0, stream.viewers - 1)
      liveStreams.set(username, stream)
      broadcastLive()
    }
    const hostId = hostSockets.get(username)
    if (whip.hasPublisher(username)) whip.removeViewer(username, socket.id)
    else if (hostId) io.to(hostId).emit('viewer:left', { viewerId: socket.id })
    socket.data.watching = null
  })

  socket.on('webrtc:offer', ({ to, sdp }) => {
    if (to) io.to(to).emit('webrtc:offer', { from: socket.id, sdp })
  })

  socket.on('webrtc:answer', ({ to, sdp }) => {
    if (typeof to === 'string' && to.startsWith('sfu:')) {
      whip.handleAnswer(to.slice(4), socket.id, sdp).catch(() => {})
      return
    }
    if (to) io.to(to).emit('webrtc:answer', { from: socket.id, sdp })
  })

  socket.on('webrtc:ice', ({ to, candidate }) => {
    if (typeof to === 'string' && to.startsWith('sfu:')) {
      whip.handleIce(to.slice(4), socket.id, candidate).catch(() => {})
      return
    }
    if (to) io.to(to).emit('webrtc:ice', { from: socket.id, candidate })
  })

  socket.on('live:stop', () => {
    const username = socket.data.liveUsername
    if (!username) return
    if (whip.hasPublisher(username)) {
      socket.data.liveUsername = null
      return
    }
    const current = liveStreams.get(username)
    if (current && current.source !== 'webrtc') {
      socket.data.liveUsername = null
      return
    }
    liveStreams.delete(username)
    hostSockets.delete(username)
    io.to(`watch:${username}`).emit('live:ended')
    socket.data.liveUsername = null
    broadcastLive()
  })

  socket.on('disconnect', () => {
    const watching = socket.data.watching
    if (watching) {
      const stream = liveStreams.get(watching)
      if (stream) {
        stream.viewers = Math.max(0, stream.viewers - 1)
        liveStreams.set(watching, stream)
      }
      const hostId = hostSockets.get(watching)
      if (whip.hasPublisher(watching)) whip.removeViewer(watching, socket.id)
      else if (hostId) io.to(hostId).emit('viewer:left', { viewerId: socket.id })
    }
    const username = socket.data.liveUsername
    if (username) {
      if (whip.hasPublisher(username)) {
        socket.data.liveUsername = null
      } else {
        const current = liveStreams.get(username)
        if (!current || current.source === 'webrtc') {
          liveStreams.delete(username)
          hostSockets.delete(username)
          io.to(`watch:${username}`).emit('live:ended')
        }
      }
    }
    broadcastLive()
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VOLT server on http://localhost:${PORT}`)
})

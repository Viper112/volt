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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'wardogs-dev-secret'
const INVITE_CODE = (process.env.INVITE_CODE || 'WARDOGS').toUpperCase()
const USERS_FILE = path.join(__dirname, 'users.json')
const MESSAGES_FILE = path.join(__dirname, 'messages.json')
const DATA_DIR = path.join(__dirname, '..', 'dist')

const CHANNELS = [
  { id: 'announcements', name: 'announcements', topic: 'Pack-wide orders. Keep it clear.', category: 'Command' },
  { id: 'general', name: 'general', topic: 'The main hangout. Say what\'s up.', category: 'Command' },
  { id: 'ops', name: 'ops', topic: 'Plans, raids, and coordination.', category: 'Command' },
  { id: 'barracks', name: 'barracks', topic: 'Late-night chaos and pack banter.', category: 'Down time' },
  { id: 'clips', name: 'clips', topic: 'Drop highlights and war stories.', category: 'Down time' },
  { id: 'music', name: 'music', topic: 'What\'s playing in the kennel.', category: 'Down time' },
]

const app = express()
app.use(cors())
app.use(express.json({ limit: '32kb' }))

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

let users = loadJson(USERS_FILE, [])
let messagesByChannel = loadJson(MESSAGES_FILE, {})

for (const ch of CHANNELS) {
  if (!Array.isArray(messagesByChannel[ch.id])) messagesByChannel[ch.id] = []
}

if (!users.find((u) => u.username === 'demo')) {
  users.push({
    id: 'demo',
    username: 'demo',
    displayName: 'Alpha Demo',
    passwordHash: bcrypt.hashSync('demo123', 8),
    status: 'online',
    createdAt: Date.now(),
  })
  saveJson(USERS_FILE, users)
}

const online = new Map() // userId -> { socketIds: Set, status }

function publicUser(u, presence) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    status: presence?.status || (online.has(u.id) ? 'online' : 'offline'),
  }
}

function authFromHeader(req) {
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

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
}

function presenceList() {
  return users.map((u) => publicUser(u, online.get(u.id))).sort((a, b) => {
    const rank = { online: 0, idle: 1, dnd: 2, offline: 3 }
    const d = (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
    if (d !== 0) return d
    return a.displayName.localeCompare(b.displayName)
  })
}

function broadcastPresence() {
  io.emit('presence:update', { members: presenceList() })
}

function sanitizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'War Dogs' })
})

app.get('/api/meta', (_req, res) => {
  res.json({
    name: 'War Dogs',
    tagline: 'Private pack chat for the crew',
    inviteHint: 'Ask a dog for the invite code',
    channels: CHANNELS,
  })
})

app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body.username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20)
  const displayName = String(req.body.displayName || username).trim().slice(0, 32)
  const password = String(req.body.password || '')
  const invite = String(req.body.invite || '').trim().toUpperCase()

  if (!username || username.length < 2) {
    return res.status(400).json({ error: 'Username needs at least 2 characters.' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password needs at least 4 characters.' })
  }
  if (invite !== INVITE_CODE) {
    return res.status(403).json({ error: 'Wrong invite code. Pack only.' })
  }
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: 'That callsign is taken.' })
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    displayName: displayName || username,
    passwordHash: await bcrypt.hash(password, 8),
    status: 'online',
    createdAt: Date.now(),
  }
  users.push(user)
  saveJson(USERS_FILE, users)

  const token = signToken(user)
  res.json({ token, user: publicUser(user, { status: 'online' }) })
})

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const user = users.find((u) => u.username === username)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Bad callsign or password.' })
  }
  const token = signToken(user)
  res.json({ token, user: publicUser(user, online.get(user.id) || { status: 'online' }) })
})

app.get('/api/auth/me', (req, res) => {
  const user = authFromHeader(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  res.json({ user: publicUser(user, online.get(user.id)) })
})

app.get('/api/channels', (req, res) => {
  const user = authFromHeader(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  res.json({ channels: CHANNELS })
})

app.get('/api/channels/:id/messages', (req, res) => {
  const user = authFromHeader(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const channel = CHANNELS.find((c) => c.id === req.params.id)
  if (!channel) return res.status(404).json({ error: 'Channel not found' })
  const list = messagesByChannel[channel.id] || []
  res.json({ messages: list.slice(-200) })
})

app.get('/api/members', (req, res) => {
  const user = authFromHeader(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  res.json({ members: presenceList() })
})

if (fs.existsSync(DATA_DIR)) {
  app.use(express.static(DATA_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(path.join(DATA_DIR, 'index.html'))
  })
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Unauthorized'))
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = users.find((u) => u.id === payload.id)
    if (!user) return next(new Error('Unauthorized'))
    socket.user = user
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  const user = socket.user
  let entry = online.get(user.id)
  if (!entry) {
    entry = { socketIds: new Set(), status: 'online' }
    online.set(user.id, entry)
  }
  entry.socketIds.add(socket.id)
  entry.status = 'online'
  broadcastPresence()

  socket.emit('ready', {
    channels: CHANNELS,
    members: presenceList(),
    user: publicUser(user, entry),
  })

  socket.on('channel:join', (channelId) => {
    const channel = CHANNELS.find((c) => c.id === channelId)
    if (!channel) return
    for (const room of socket.rooms) {
      if (room.startsWith('channel:')) socket.leave(room)
    }
    socket.join(`channel:${channelId}`)
    const list = messagesByChannel[channelId] || []
    socket.emit('channel:history', { channelId, messages: list.slice(-200) })
  })

  socket.on('message:send', (payload) => {
    const channelId = String(payload?.channelId || '')
    const text = sanitizeText(payload?.text)
    const channel = CHANNELS.find((c) => c.id === channelId)
    if (!channel || !text) return

    const msg = {
      id: crypto.randomUUID(),
      channelId,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      createdAt: Date.now(),
    }
    if (!messagesByChannel[channelId]) messagesByChannel[channelId] = []
    messagesByChannel[channelId].push(msg)
    if (messagesByChannel[channelId].length > 500) {
      messagesByChannel[channelId] = messagesByChannel[channelId].slice(-400)
    }
    saveJson(MESSAGES_FILE, messagesByChannel)
    io.to(`channel:${channelId}`).emit('message:new', msg)
  })

  socket.on('presence:set', (status) => {
    const allowed = ['online', 'idle', 'dnd']
    if (!allowed.includes(status)) return
    const current = online.get(user.id)
    if (!current) return
    current.status = status
    broadcastPresence()
  })

  socket.on('typing:start', (channelId) => {
    if (!CHANNELS.find((c) => c.id === channelId)) return
    socket.to(`channel:${channelId}`).emit('typing:update', {
      channelId,
      userId: user.id,
      displayName: user.displayName,
      typing: true,
    })
  })

  socket.on('typing:stop', (channelId) => {
    if (!CHANNELS.find((c) => c.id === channelId)) return
    socket.to(`channel:${channelId}`).emit('typing:update', {
      channelId,
      userId: user.id,
      displayName: user.displayName,
      typing: false,
    })
  })

  socket.on('disconnect', () => {
    const current = online.get(user.id)
    if (!current) return
    current.socketIds.delete(socket.id)
    if (current.socketIds.size === 0) {
      online.delete(user.id)
    }
    broadcastPresence()
  })
})

server.listen(PORT, () => {
  console.log(`War Dogs listening on :${PORT}`)
})

import { io, type Socket } from 'socket.io-client'
import { getToken } from './api'

let socket: Socket | null = null

export function getSocket() {
  const token = getToken()
  if (!token) throw new Error('Not signed in')

  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      auth: { token },
      autoConnect: true,
    })
  } else if (socket.auth && typeof socket.auth === 'object') {
    ;(socket.auth as { token: string }).token = token
    if (!socket.connected) socket.connect()
  }
  return socket
}

export function resetSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

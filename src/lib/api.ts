import type { Stream, User } from '../types'

const TOKEN_KEY = 'volt_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(path, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export const api = {
  me: () => request<{ user: User }>('/api/me'),
  register: (username: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  follow: (username: string) =>
    request<{ following: string[] }>(`/api/follow/${username}`, { method: 'POST' }),
  unfollow: (username: string) =>
    request<{ following: string[] }>(`/api/follow/${username}`, { method: 'DELETE' }),
  liveStreams: () => request<{ streams: Stream[] }>('/api/live'),
  ingest: () =>
    request<{
      rtmpUrl: string
      whipUrl: string
      streamKey: string
      playbackUrl: string
      title: string
      category: string
      live: boolean
    }>('/api/ingest'),
  saveIngest: (title: string, category: string) =>
    request<{
      rtmpUrl: string
      whipUrl: string
      streamKey: string
      playbackUrl: string
      title: string
      category: string
      live: boolean
    }>('/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    }),
  rotateKey: () =>
    request<{ streamKey: string; rtmpUrl: string; whipUrl: string }>('/api/ingest/rotate', { method: 'POST' }),
}

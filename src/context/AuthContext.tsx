import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../lib/api'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  follow: (username: string) => Promise<void>
  unfollow: (username: string) => Promise<void>
  isFollowing: (username: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async login(username, password) {
        const res = await api.login(username, password)
        setToken(res.token)
        setUser(res.user)
      },
      async register(username, password) {
        const res = await api.register(username, password)
        setToken(res.token)
        setUser(res.user)
      },
      logout() {
        setToken(null)
        setUser(null)
      },
      async follow(username) {
        const res = await api.follow(username)
        setUser((u) => (u ? { ...u, following: res.following } : u))
      },
      async unfollow(username) {
        const res = await api.unfollow(username)
        setUser((u) => (u ? { ...u, following: res.following } : u))
      },
      isFollowing(username) {
        return !!user?.following.includes(username.toLowerCase())
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

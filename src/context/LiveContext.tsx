import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import type { Stream } from '../types'

type LiveContextValue = {
  streams: Stream[]
  liveUsernames: Set<string>
}

const LiveContext = createContext<LiveContextValue | null>(null)

export function LiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<Stream[]>([])

  useEffect(() => {
    api.liveStreams().then((res) => setLive(res.streams)).catch(() => {})
    const socket = getSocket()
    const onUpdate = (payload: { streams: Stream[] }) => setLive(payload.streams)
    socket.on('live:update', onUpdate)
    return () => {
      socket.off('live:update', onUpdate)
    }
  }, [])

  const value = useMemo(() => {
    const streams = [...live].sort((a, b) => b.viewers - a.viewers)
    return {
      streams,
      liveUsernames: new Set(streams.map((s) => s.username.toLowerCase())),
    }
  }, [live])

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>
}

export function useLive() {
  const ctx = useContext(LiveContext)
  if (!ctx) throw new Error('useLive must be used within LiveProvider')
  return ctx
}

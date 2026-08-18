import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { avatarUrl, categoryName, streamerByUsername } from '../data/catalog'
import { formatViewers } from '../lib/format'
import type { Stream } from '../types'

export function FeaturedCarousel({ streams }: { streams: Stream[] }) {
  const featured = useMemo(() => streams.filter((s) => s.featured).slice(0, 5), [streams])
  const fallback = featured.length ? featured : streams.slice(0, 5)
  const [i, setI] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const current = fallback[i]

  useEffect(() => {
    if (!fallback.length) return
    const t = setInterval(() => setI((n) => (n + 1) % fallback.length), 9000)
    return () => clearInterval(t)
  }, [fallback.length])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = 8
    el.play().catch(() => {})
  }, [i, current?.videoUrl])

  if (!current) return null
  const streamer = streamerByUsername(current.username)

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <Link to={`/${current.username}`} className="block">
        {current.videoUrl ? (
          <video
            ref={videoRef}
            key={current.id}
            src={current.videoUrl}
            poster={current.thumbnail}
            muted={muted}
            loop
            playsInline
            className="aspect-[21/9] max-h-[420px] w-full object-cover"
          />
        ) : (
          <img src={current.thumbnail} alt="" className="aspect-[21/9] max-h-[420px] w-full object-cover" />
        )}
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={avatarUrl(streamer?.seed || current.username)}
            alt=""
            className="h-12 w-12 rounded-full border-2 border-volt bg-raised"
          />
          <div className="min-w-0">
            <Link to={`/${current.username}`} className="block truncate text-lg font-bold hover:text-volt">
              {streamer?.displayName || current.username}
            </Link>
            <div className="truncate text-sm text-[#d7dbde]">{current.title}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-mute">
              <span className="rounded bg-volt px-1.5 py-0.5 font-black text-black">LIVE</span>
              <Link to={`/directory/${current.category}`} className="hover:text-white">
                {categoryName(current.category)}
              </Link>
              <span>{formatViewers(current.viewers)} watching</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex gap-1">
            {fallback.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full ${idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-md bg-black/50 p-2 hover:bg-black/80"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setI((n) => (n - 1 + fallback.length) % fallback.length)}
            className="rounded-md bg-black/50 p-2 hover:bg-black/80"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setI((n) => (n + 1) % fallback.length)}
            className="rounded-md bg-black/50 p-2 hover:bg-black/80"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

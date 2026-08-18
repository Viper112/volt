import { useEffect, useRef, useState } from 'react'
import flvjs from 'flv.js'
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react'

type PlayerProps = {
  src?: string
  poster?: string
  stream?: MediaStream | null
  live?: boolean
  format?: 'file' | 'flv'
}

export function Player({ src, poster, stream, live = true, format = 'file' }: PlayerProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(0.8)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (stream) {
      el.srcObject = stream
      el.play().catch(() => {})
      return () => {
        el.srcObject = null
      }
    }
    el.srcObject = null
  }, [stream])

  useEffect(() => {
    const el = ref.current
    if (!el || stream || format !== 'flv' || !src) return
    if (!flvjs.isSupported()) return
    const player = flvjs.createPlayer(
      { type: 'flv', url: src, isLive: true, hasAudio: true, hasVideo: true },
      { enableStashBuffer: false, stashInitialSize: 128 },
    )
    player.attachMediaElement(el)
    player.load()
    player.play()
    return () => {
      player.pause()
      player.unload()
      player.detachMediaElement()
      player.destroy()
    }
  }, [src, format, stream])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = muted
    el.volume = volume
  }, [muted, volume])

  function togglePlay() {
    const el = ref.current
    if (!el) return
    if (el.paused) {
      el.play()
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
  }

  async function fullscreen() {
    await ref.current?.parentElement?.requestFullscreen()
  }

  const useFileSrc = !stream && format !== 'flv'

  return (
    <div className="group relative bg-black">
      <video
        ref={ref}
        src={useFileSrc ? src : undefined}
        poster={poster}
        autoPlay
        muted={muted}
        loop={useFileSrc}
        playsInline
        className="aspect-video w-full bg-black object-contain"
        onClick={togglePlay}
      />
      {live && (
        <span className="absolute left-3 top-3 rounded-[4px] bg-volt px-1.5 py-0.5 text-[11px] font-black text-black">
          LIVE
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 opacity-0 transition group-hover:opacity-100">
        <button onClick={togglePlay} className="p-1 hover:text-volt">
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={() => setMuted((m) => !m)} className="p-1 hover:text-volt">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
            setMuted(v === 0)
          }}
          className="w-24 accent-volt"
        />
        <span className="ml-auto text-xs text-mute">{format === 'flv' ? 'RTMP' : '1080p'}</span>
        <button onClick={fullscreen} className="p-1 hover:text-volt">
          <Maximize size={16} />
        </button>
      </div>
    </div>
  )
}

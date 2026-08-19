import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cast, Copy, Eye, EyeOff, Monitor, Radio, RefreshCw, Square, Video } from 'lucide-react'
import { Chat } from '../components/Chat'
import { AuthModal } from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import { useLive } from '../context/LiveContext'
import { categories } from '../data/catalog'
import { api } from '../lib/api'
import { ice } from '../lib/ice'
import { getSocket } from '../lib/socket'

export function GoLive() {
  const { user } = useAuth()
  const { streams } = useLive()
  const navigate = useNavigate()
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)
  const [title, setTitle] = useState('Live on VOLT')
  const [category, setCategory] = useState('just-chatting')
  const [source, setSource] = useState<'camera' | 'screen'>('camera')
  const [live, setLive] = useState(false)
  const [error, setError] = useState('')
  const [rtmpUrl, setRtmpUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState('')
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const handlersRef = useRef<{
    onViewer: (p: { viewerId: string }) => void
    onAnswer: (p: { from: string; sdp: RTCSessionDescriptionInit }) => void
    onIce: (p: { from: string; candidate: RTCIceCandidateInit }) => void
    onLeft: (p: { viewerId: string }) => void
  } | null>(null)

  const obsLive = !!user && streams.some((s) => s.username === user.username && (s.source === 'rtmp' || s.source === 'whip'))
  const serverUrl = streamKey
    ? `${window.location.origin}/api/whip/${encodeURIComponent(streamKey)}`
    : `${window.location.origin}/api/whip`

  useEffect(() => {
    return () => stopAll()
  }, [])

  useEffect(() => {
    if (!user) return
    api
      .ingest()
      .then((res) => {
        setRtmpUrl(res.whipUrl || res.rtmpUrl)
        setStreamKey(res.streamKey)
        setTitle(res.title)
        setCategory(res.category)
      })
      .catch(() => {})
  }, [user])

  async function getMedia() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    const media =
      source === 'camera'
        ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    streamRef.current = media
    if (previewRef.current) {
      previewRef.current.srcObject = media
      await previewRef.current.play().catch(() => {})
    }
    return media
  }

  function detachSignaling() {
    const socket = getSocket()
    const h = handlersRef.current
    if (!h) return
    socket.off('viewer:joined', h.onViewer)
    socket.off('webrtc:answer', h.onAnswer)
    socket.off('webrtc:ice', h.onIce)
    socket.off('viewer:left', h.onLeft)
    handlersRef.current = null
  }

  function stopAll() {
    detachSignaling()
    const socket = getSocket()
    socket.emit('live:stop')
    pcsRef.current.forEach((pc) => pc.close())
    pcsRef.current.clear()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
    setLive(false)
  }

  async function start(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setAuth('signup')
      return
    }
    setError('')
    try {
      const media = await getMedia()
      const socket = getSocket()
      socket.emit('live:start', {
        username: user.username,
        title,
        category,
        language: 'English',
        tags: ['English'],
      })

      const onViewer = async ({ viewerId }: { viewerId: string }) => {
        const pc = new RTCPeerConnection(ice)
        media.getTracks().forEach((t) => pc.addTrack(t, media))
        pc.onicecandidate = (ev) => {
          if (ev.candidate) socket.emit('webrtc:ice', { to: viewerId, candidate: ev.candidate })
        }
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc:offer', { to: viewerId, sdp: offer })
        pcsRef.current.set(viewerId, pc)
      }
      const onAnswer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
        await pcsRef.current.get(from)?.setRemoteDescription(sdp)
      }
      const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        if (candidate) await pcsRef.current.get(from)?.addIceCandidate(candidate)
      }
      const onLeft = ({ viewerId }: { viewerId: string }) => {
        pcsRef.current.get(viewerId)?.close()
        pcsRef.current.delete(viewerId)
      }

      socket.on('viewer:joined', onViewer)
      socket.on('webrtc:answer', onAnswer)
      socket.on('webrtc:ice', onIce)
      socket.on('viewer:left', onLeft)
      handlersRef.current = { onViewer, onAnswer, onIce, onLeft }
      setLive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start camera or screen share.')
    }
  }

  async function saveObsSettings() {
    setError('')
    try {
      const res = await api.saveIngest(title, category)
      setRtmpUrl(res.whipUrl || res.rtmpUrl)
      setStreamKey(res.streamKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save stream info.')
    }
  }

  async function rotate() {
    if (!confirm('This disconnects any OBS session using the old key. Continue?')) return
    const res = await api.rotateKey()
    setStreamKey(res.streamKey)
    setRtmpUrl(res.whipUrl || res.rtmpUrl)
  }

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1200)
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">Go live on VOLT</h1>
        <p className="mt-2 text-mute">Create an account, then stream from your camera, screen, or OBS.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setAuth('login')} className="rounded-md px-4 py-2 font-semibold hover:bg-hover">
            Log In
          </button>
          <button
            onClick={() => setAuth('signup')}
            className="rounded-md bg-volt px-4 py-2 font-bold text-black hover:bg-volt-dim"
          >
            Sign Up
          </button>
        </div>
        {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold">Creator dashboard</h1>
        <p className="mt-1 text-sm text-mute">
          Channel:{' '}
          <Link to={`/${user.username}`} className="text-volt hover:underline">
            volt.live/{user.username}
          </Link>
        </p>

        <div className="mt-5 overflow-hidden rounded-lg bg-black">
          <video ref={previewRef} muted playsInline className="aspect-video w-full object-contain" />
        </div>
        <form onSubmit={start} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-mute">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-raised px-3 py-2 text-white outline-none focus:border-volt"
            />
          </label>
          <label className="text-sm text-mute">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-raised px-3 py-2 text-white"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource('camera')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                source === 'camera' ? 'bg-volt text-black' : 'bg-raised hover:bg-hover'
              }`}
            >
              <Video size={15} /> Camera
            </button>
            <button
              type="button"
              onClick={() => setSource('screen')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                source === 'screen' ? 'bg-volt text-black' : 'bg-raised hover:bg-hover'
              }`}
            >
              <Monitor size={15} /> Screen
            </button>
          </div>
          <div className="flex items-end gap-2">
            {!live ? (
              <button className="inline-flex items-center gap-2 rounded-md bg-volt px-4 py-2 font-bold text-black hover:bg-volt-dim">
                <Radio size={16} /> Start stream
              </button>
            ) : (
              <button
                type="button"
                onClick={stopAll}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-bold hover:bg-red-500"
              >
                <Square size={14} /> End stream
              </button>
            )}
            {(live || obsLive) && (
              <button
                type="button"
                onClick={() => navigate(`/${user.username}`)}
                className="rounded-md bg-raised px-4 py-2 text-sm font-semibold hover:bg-hover"
              >
                Open channel
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-xl border border-line bg-raised p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Cast size={18} className="text-volt" /> Stream with OBS
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                obsLive ? 'bg-volt text-black' : 'bg-ink text-mute'
              }`}
            >
              {obsLive ? 'LIVE FROM OBS' : 'OFFLINE'}
            </span>
          </div>
          <p className="mt-2 text-sm text-mute">
            OBS will fail if Service is still <span className="text-white">Custom</span> (RTMP). Set Service to{' '}
            <span className="text-white">WHIP</span>, then paste the values below.
          </p>
          <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Open this live website in a browser first (so the host is awake), then in OBS: Settings → Stream → Service:{' '}
            <strong className="text-white">WHIP</strong> → Server + Bearer token → Apply → Start Streaming.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="block text-sm text-mute">
              Server
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={serverUrl}
                  placeholder="Loading…"
                  className="w-full rounded-md border border-line bg-ink px-3 py-2 font-mono text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => copy('server', serverUrl)}
                  className="rounded-md bg-hover px-3 hover:bg-line"
                  title="Copy server"
                >
                  <Copy size={16} />
                </button>
              </div>
            </label>
            <label className="block text-sm text-mute">
              Bearer token (stream key)
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  type={showKey ? 'text' : 'password'}
                  value={streamKey}
                  placeholder="Loading…"
                  className="w-full rounded-md border border-line bg-ink px-3 py-2 font-mono text-sm text-white"
                />
                <button type="button" onClick={() => setShowKey((v) => !v)} className="rounded-md bg-hover px-3 hover:bg-line">
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => copy('key', streamKey)}
                  className="rounded-md bg-hover px-3 hover:bg-line"
                >
                  <Copy size={16} />
                </button>
                <button type="button" onClick={rotate} className="rounded-md bg-hover px-3 hover:bg-line" title="Reset key">
                  <RefreshCw size={16} />
                </button>
              </div>
            </label>
          </div>
          {copied && <p className="mt-2 text-xs text-volt">Copied {copied}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveObsSettings}
              className="rounded-md bg-ink px-3 py-2 text-sm font-semibold hover:bg-hover"
            >
              Save title for OBS
            </button>
            {obsLive && (
              <span className="text-sm text-volt">Receiving your OBS feed. Viewers can watch the channel.</span>
            )}
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-mute">
            <li>In OBS, Service must be WHIP — not Custom, not Twitch, not YouTube.</li>
            <li>Paste Server and Bearer token, click Apply, then Start Streaming.</li>
            <li>This page switches to LIVE FROM OBS when the ingest connects.</li>
          </ol>
        </section>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
      <Chat slug={user.username} />
    </div>
  )
}

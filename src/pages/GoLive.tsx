import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Monitor, Radio, Square, Video } from 'lucide-react'
import { Chat } from '../components/Chat'
import { AuthModal } from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/catalog'
import { getSocket } from '../lib/socket'

const ice = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export function GoLive() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)
  const [title, setTitle] = useState('Live on VOLT')
  const [category, setCategory] = useState('just-chatting')
  const [source, setSource] = useState<'camera' | 'screen'>('camera')
  const [live, setLive] = useState(false)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const handlersRef = useRef<{
    onViewer: (p: { viewerId: string }) => void
    onAnswer: (p: { from: string; sdp: RTCSessionDescriptionInit }) => void
    onIce: (p: { from: string; candidate: RTCIceCandidateInit }) => void
    onLeft: (p: { viewerId: string }) => void
  } | null>(null)

  useEffect(() => {
    return () => stopAll()
  }, [])

  async function getMedia() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    const stream =
      source === 'camera'
        ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    streamRef.current = stream
    if (previewRef.current) {
      previewRef.current.srcObject = stream
      await previewRef.current.play().catch(() => {})
    }
    return stream
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

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">Go live on VOLT</h1>
        <p className="mt-2 text-mute">Create an account, then stream from your camera or screen — no OBS required.</p>
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
          Channel: <Link to={`/${user.username}`} className="text-volt hover:underline">volt.live/{user.username}</Link>
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
            {live && (
              <button type="button" onClick={() => navigate(`/${user.username}`)} className="rounded-md bg-raised px-4 py-2 text-sm font-semibold hover:bg-hover">
                Open channel
              </button>
            )}
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <p className="mt-4 text-xs text-mute">
          Open your channel in another tab or on another device to watch the WebRTC broadcast. Catalog channels on the
          homepage play demo videos so the grid feels full from the first load.
        </p>
      </div>
      <Chat slug={user.username} simulated={false} />
    </div>
  )
}

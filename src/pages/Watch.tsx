import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, Heart, Share2, Star, Users } from 'lucide-react'
import { Chat } from '../components/Chat'
import { Player } from '../components/Player'
import { AuthModal } from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import { useLive } from '../context/LiveContext'
import { avatarUrl, streamerByUsername, categoryName } from '../data/catalog'
import { formatFollowers, formatViewers } from '../lib/format'
import { getSocket } from '../lib/socket'
import { ice } from '../lib/ice'
import type { Streamer } from '../types'

function fallbackStreamer(username: string): Streamer {
  return {
    username,
    displayName: username,
    verified: false,
    followers: 0,
    bio: 'Live on VOLT.',
    seed: username,
    socials: {},
  }
}

export function Watch() {
  const { username = '' } = useParams()
  const slug = username.toLowerCase()
  const { streams } = useLive()
  const { user, isFollowing, follow, unfollow } = useAuth()
  const stream = streams.find((s) => s.username.toLowerCase() === slug)
  const streamer = streamerByUsername(slug) || fallbackStreamer(slug)
  const [remote, setRemote] = useState<MediaStream | null>(null)
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const isWebrtc = stream?.source === 'webrtc' || stream?.source === 'whip'
  const isRtmp = stream?.source === 'rtmp'
  const isLive = !!stream
  const isOwn = user?.username === slug

  useEffect(() => {
    setRemote(null)
    if (!isWebrtc) return
    const socket = getSocket()
    const pc = new RTCPeerConnection(ice)
    pcRef.current = pc
    const pending: RTCIceCandidateInit[] = []
    let hostId: string | null = null

    pc.ontrack = (e) => {
      setRemote(e.streams[0] || new MediaStream([e.track]))
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && hostId) socket.emit('webrtc:ice', { to: hostId, candidate: e.candidate })
    }

    const onOffer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      hostId = from
      await pc.setRemoteDescription(sdp)
      for (const c of pending) await pc.addIceCandidate(c)
      pending.length = 0
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { to: from, sdp: answer })
    }
    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!candidate) return
      if (pc.remoteDescription) await pc.addIceCandidate(candidate)
      else pending.push(candidate)
    }
    const onEnded = () => setRemote(null)

    socket.on('webrtc:offer', onOffer)
    socket.on('webrtc:ice', onIce)
    socket.on('live:ended', onEnded)
    socket.emit('watch:join', slug)

    return () => {
      socket.emit('watch:leave')
      socket.off('webrtc:offer', onOffer)
      socket.off('webrtc:ice', onIce)
      socket.off('live:ended', onEnded)
      pc.close()
      pcRef.current = null
    }
  }, [slug, isWebrtc])

  async function onFollow() {
    if (!user) {
      setAuth('signup')
      return
    }
    setBusy(true)
    try {
      if (isFollowing(slug)) await unfollow(slug)
      else await follow(slug)
    } finally {
      setBusy(false)
    }
  }

  function share() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="min-w-0 flex-1 overflow-y-auto">
        {isLive ? (
          <div className="relative">
            <Player
              src={isWebrtc ? undefined : stream.videoUrl}
              poster={stream.thumbnail}
              stream={isWebrtc ? remote : null}
              format={isRtmp ? 'flv' : 'file'}
            />
            {isWebrtc && !remote && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 text-sm text-mute">
                Connecting to live broadcast…
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-[#111] text-mute">
            {isOwn ? 'You are offline. Head to Go Live to start a stream.' : `${streamer.displayName} is offline.`}
          </div>
        )}
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <img
                src={avatarUrl(streamer.seed)}
                alt=""
                className={`h-16 w-16 rounded-full bg-raised ${isLive ? 'ring-2 ring-volt' : ''}`}
              />
              <div className="min-w-0">
                <h1 className="flex items-center gap-1.5 text-xl font-bold">
                  {streamer.displayName}
                  {streamer.verified && <BadgeCheck size={18} className="text-volt" />}
                </h1>
                <p className="mt-0.5 line-clamp-2 text-sm text-[#d7dbde]">{stream?.title || 'Offline'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {stream && (
                    <Link
                      to={`/directory/${stream.category}`}
                      className="rounded-full bg-raised px-2 py-0.5 text-mute hover:text-white"
                    >
                      {categoryName(stream.category)}
                    </Link>
                  )}
                  {stream?.language && (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-mute">{stream.language}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                {!isOwn && (
                  <button
                    disabled={busy}
                    onClick={onFollow}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold ${
                      isFollowing(slug)
                        ? 'bg-raised hover:bg-hover'
                        : 'bg-volt text-black hover:bg-volt-dim'
                    }`}
                  >
                    <Heart size={15} fill={isFollowing(slug) ? 'currentColor' : 'none'} />
                    {isFollowing(slug) ? 'Following' : 'Follow'}
                  </button>
                )}
                <button className="inline-flex items-center gap-1.5 rounded-md bg-raised px-3 py-2 text-sm font-semibold hover:bg-hover">
                  <Star size={15} /> Subscribe
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-mute">
                {isLive && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} /> {formatViewers(stream.viewers)} watching
                  </span>
                )}
                <button onClick={share} className="inline-flex items-center gap-1 hover:text-white">
                  <Share2 size={14} /> {copied ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-lg bg-raised p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">About {streamer.displayName}</h2>
              <span className="text-sm text-mute">{formatFollowers(streamer.followers)} followers</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-mute">
              {streamer.socials.x && <span>X @{streamer.socials.x}</span>}
              {streamer.socials.instagram && <span>Instagram @{streamer.socials.instagram}</span>}
              {streamer.socials.youtube && <span>YouTube @{streamer.socials.youtube}</span>}
              {streamer.socials.discord && <span>Discord {streamer.socials.discord}</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#d7dbde]">{streamer.bio}</p>
            {isOwn && (
              <Link to="/go-live" className="mt-4 inline-block text-sm font-semibold text-volt hover:underline">
                Open creator dashboard
              </Link>
            )}
          </section>
        </div>
      </div>
      <Chat slug={slug} />
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />}
    </div>
  )
}

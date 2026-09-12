import { useEffect, useMemo, useState } from 'react'
import { LoginGate } from './components/LoginGate'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChatView } from './components/ChatView'
import { MemberList } from './components/MemberList'
import { useAuth } from './context/AuthContext'
import { getSocket } from './lib/socket'
import type { Channel, ChatMessage, Member, PresenceStatus } from './types'

export default function App() {
  const { user, loading } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activeId, setActiveId] = useState('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'channels' | 'members'>('chat')

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeId),
    [channels, activeId],
  )

  const typingNames = useMemo(
    () => Object.values(typing).filter(Boolean),
    [typing],
  )

  useEffect(() => {
    if (!user) {
      setReady(false)
      setChannels([])
      setMembers([])
      setMessages([])
      return
    }

    const socket = getSocket()

    const onReady = (payload: { channels: Channel[]; members: Member[] }) => {
      setChannels(payload.channels)
      setMembers(payload.members)
      setReady(true)
      socket.emit('channel:join', activeId)
    }

    const onHistory = (payload: { channelId: string; messages: ChatMessage[] }) => {
      if (payload.channelId !== activeId) return
      setMessages(payload.messages)
      setTyping({})
    }

    const onMessage = (msg: ChatMessage) => {
      if (msg.channelId !== activeId) return
      setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg])
    }

    const onPresence = (payload: { members: Member[] }) => {
      setMembers(payload.members)
    }

    const onTyping = (payload: {
      channelId: string
      userId: string
      displayName: string
      typing: boolean
    }) => {
      if (payload.channelId !== activeId || payload.userId === user.id) return
      setTyping((prev) => {
        const next = { ...prev }
        if (payload.typing) next[payload.userId] = payload.displayName
        else delete next[payload.userId]
        return next
      })
    }

    socket.on('ready', onReady)
    socket.on('channel:history', onHistory)
    socket.on('message:new', onMessage)
    socket.on('presence:update', onPresence)
    socket.on('typing:update', onTyping)

    if (socket.connected) {
      socket.emit('channel:join', activeId)
    }

    return () => {
      socket.off('ready', onReady)
      socket.off('channel:history', onHistory)
      socket.off('message:new', onMessage)
      socket.off('presence:update', onPresence)
      socket.off('typing:update', onTyping)
    }
  }, [user, activeId])

  function selectChannel(id: string) {
    setActiveId(id)
    setMessages([])
    setTyping({})
    setMobilePanel('chat')
    try {
      getSocket().emit('channel:join', id)
    } catch {
      /* not connected yet */
    }
  }

  function sendMessage(text: string) {
    getSocket().emit('message:send', { channelId: activeId, text })
  }

  function setTypingState(isTyping: boolean) {
    const socket = getSocket()
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', activeId)
  }

  function setStatus(status: PresenceStatus) {
    if (status === 'offline') return
    getSocket().emit('presence:set', status)
  }

  if (loading) {
    return (
      <div className="boot">
        <p className="brand-mark">WAR DOGS</p>
        <p className="boot-copy">Waking the kennel…</p>
      </div>
    )
  }

  if (!user) return <LoginGate />

  return (
    <div className={`app-shell ${mobilePanel}`}>
      <div className="brand-rail" aria-hidden>
        <div className="brand-orb">WD</div>
      </div>

      <div className={`panel-channels ${mobilePanel === 'channels' ? 'show' : ''}`}>
        <ChannelSidebar channels={channels} activeId={activeId} onSelect={selectChannel} />
      </div>

      <div className={`panel-chat ${mobilePanel === 'chat' ? 'show' : ''}`}>
        {ready ? (
          <ChatView
            channel={activeChannel}
            messages={messages}
            typingNames={typingNames}
            onSend={sendMessage}
            onTyping={setTypingState}
          />
        ) : (
          <div className="boot inline">
            <p>Linking up…</p>
          </div>
        )}
      </div>

      <div className={`panel-members ${mobilePanel === 'members' ? 'show' : ''}`}>
        <MemberList
          members={members.map((m) => (m.id === user.id ? { ...m, status: m.status } : m))}
          onStatus={setStatus}
        />
      </div>

      <nav className="mobile-nav">
        <button
          type="button"
          className={mobilePanel === 'channels' ? 'active' : ''}
          onClick={() => setMobilePanel('channels')}
        >
          Channels
        </button>
        <button
          type="button"
          className={mobilePanel === 'chat' ? 'active' : ''}
          onClick={() => setMobilePanel('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={mobilePanel === 'members' ? 'active' : ''}
          onClick={() => setMobilePanel('members')}
        >
          Pack
        </button>
      </nav>
    </div>
  )
}

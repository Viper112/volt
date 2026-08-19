import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronLeft, Send, Smile } from 'lucide-react'
import { colorForName } from '../lib/format'
import { getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import type { ChatMessage } from '../types'

export function Chat({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([])
    const socket = getSocket()
    socket.emit('chat:join', slug)
    const onMessage = (msg: ChatMessage) => setMessages((m) => [...m.slice(-200), msg])
    socket.on('chat:message', onMessage)
    return () => {
      socket.emit('chat:leave', slug)
      socket.off('chat:message', onMessage)
    }
  }, [slug])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function send(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    const username = user?.username || 'guest'
    getSocket().emit('chat:send', {
      slug,
      username,
      text: value,
      color: colorForName(username),
    })
    setText('')
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex w-10 shrink-0 items-center justify-center border-l border-line bg-panel text-mute hover:text-white"
        title="Expand chat"
      >
        <ChevronLeft className="rotate-180" size={16} />
      </button>
    )
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex h-12 items-center justify-between border-b border-line px-3">
        <button onClick={() => setCollapsed(true)} className="rounded p-1 text-mute hover:text-white">
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-bold">Chat</div>
        <div className="w-6" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 text-[13px] leading-5">
        {messages.map((m) => (
          <p key={m.id} className="break-words py-[2px]">
            <span className="font-bold" style={{ color: m.color }}>
              {m.username}
            </span>{' '}
            <span className="text-[#eceff1]">{m.text}</span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-line p-3">
        <div className="flex items-center rounded-md border border-line bg-ink focus-within:border-mute">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? 'Send a message' : 'Log in to chat, or send as guest'}
            className="h-10 w-full bg-transparent px-3 text-sm outline-none placeholder:text-mute"
            maxLength={240}
          />
          <button type="button" className="px-2 text-mute hover:text-white" title="Emotes">
            <Smile size={16} />
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <button className="inline-flex items-center gap-1 rounded-md bg-volt px-3 py-1.5 text-sm font-bold text-black hover:bg-volt-dim">
            <Send size={14} /> Chat
          </button>
        </div>
      </form>
    </aside>
  )
}

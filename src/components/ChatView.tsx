import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Hash, Send } from 'lucide-react'
import type { Channel, ChatMessage } from '../types'
import { Avatar } from './MemberList'
import { formatDay, formatTime, sameDay } from '../lib/format'

export function ChatView({
  channel,
  messages,
  typingNames,
  onSend,
  onTyping,
}: {
  channel: Channel | undefined
  messages: ChatMessage[]
  typingNames: string[]
  onSend: (text: string) => void
  onTyping: (typing: boolean) => void
}) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, channel?.id])

  const grouped = useMemo(() => messages, [messages])

  function send(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
    onTyping(false)
  }

  function handleChange(value: string) {
    setText(value)
    onTyping(true)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => onTyping(false), 1200)
  }

  if (!channel) {
    return <main className="chat-view empty">Pick a channel.</main>
  }

  return (
    <main className="chat-view">
      <header className="chat-header">
        <Hash size={18} />
        <div>
          <h2>{channel.name}</h2>
          <p>{channel.topic}</p>
        </div>
      </header>

      <div className="message-scroller">
        <div className="channel-welcome animate-rise">
          <div className="welcome-hash">#</div>
          <h3>Welcome to #{channel.name}</h3>
          <p>{channel.topic}</p>
        </div>

        {grouped.map((msg, i) => {
          const prev = grouped[i - 1]
          const showDay = !prev || !sameDay(prev.createdAt, msg.createdAt)
          const compact =
            prev &&
            prev.userId === msg.userId &&
            msg.createdAt - prev.createdAt < 5 * 60 * 1000 &&
            !showDay

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="day-divider">
                  <span>{formatDay(msg.createdAt)}</span>
                </div>
              )}
              <article className={`message ${compact ? 'compact' : ''} animate-msg`}>
                {!compact ? (
                  <Avatar name={msg.displayName} id={msg.userId} size={40} />
                ) : (
                  <div className="msg-time-gutter">{formatTime(msg.createdAt)}</div>
                )}
                <div className="msg-body">
                  {!compact && (
                    <div className="msg-meta">
                      <span className="msg-author">{msg.displayName}</span>
                      <time dateTime={new Date(msg.createdAt).toISOString()}>
                        {formatTime(msg.createdAt)}
                      </time>
                    </div>
                  )}
                  <p className="msg-text">{msg.text}</p>
                </div>
              </article>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="composer-wrap">
        {typingNames.length > 0 && (
          <div className="typing-line">
            {typingNames.length === 1
              ? `${typingNames[0]} is typing…`
              : `${typingNames.slice(0, 2).join(', ')} are typing…`}
          </div>
        )}
        <form className="composer" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Message #${channel.name}`}
            maxLength={2000}
            aria-label="Message"
          />
          <button type="submit" disabled={!text.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      </div>
    </main>
  )
}

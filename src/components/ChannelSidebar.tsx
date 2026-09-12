import { Hash } from 'lucide-react'
import type { Channel } from '../types'

export function ChannelSidebar({
  channels,
  activeId,
  onSelect,
  serverName = 'War Dogs',
}: {
  channels: Channel[]
  activeId: string
  onSelect: (id: string) => void
  serverName?: string
}) {
  const categories = [...new Set(channels.map((c) => c.category))]

  return (
    <aside className="channel-sidebar">
      <header className="server-header">
        <div className="server-name">{serverName}</div>
        <div className="server-sub">Friends only · always on</div>
      </header>

      <nav className="channel-nav">
        {categories.map((category) => (
          <div key={category} className="channel-group">
            <div className="channel-category">{category}</div>
            {channels
              .filter((c) => c.category === category)
              .map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={`channel-item ${activeId === channel.id ? 'active' : ''}`}
                  onClick={() => onSelect(channel.id)}
                >
                  <Hash size={16} strokeWidth={2.25} />
                  <span>{channel.name}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Heart, Home, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLive } from '../context/LiveContext'
import { avatarUrl, categoryName, streamerByUsername } from '../data/catalog'
import { formatViewers } from '../lib/format'

const nav = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/browse', label: 'Browse', icon: Compass },
  { to: '/following', label: 'Following', icon: Heart },
]

export function Sidebar() {
  const [open, setOpen] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const { streams } = useLive()
  const location = useLocation()
  const recommended = useMemo(() => streams.slice(0, showAll ? 16 : 10), [streams, showAll])

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-line bg-panel transition-[width] ${
        open ? 'w-[240px]' : 'w-[56px]'
      }`}
    >
      <div className="flex items-center justify-end px-2 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1.5 text-mute hover:bg-hover hover:text-white"
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
      <nav className="px-2">
        {nav.map((item) => {
          const Icon = item.icon
          const active = item.end ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mb-0.5 flex items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold ${
                active ? 'bg-hover text-white' : 'text-[#c9cdd1] hover:bg-hover hover:text-white'
              }`}
            >
              <Icon size={20} className={active ? 'text-white' : ''} />
              {open && item.label}
            </NavLink>
          )
        })}
      </nav>
      {open && <div className="mt-4 px-4 text-[11px] font-bold uppercase tracking-wider text-mute">Recommended</div>}
      <div className="mt-1 flex-1 overflow-y-auto">
        {recommended.length ? (
          recommended.map((s) => {
          const streamer = streamerByUsername(s.username)
          return (
            <NavLink
              key={s.id}
              to={`/${s.username}`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-hover"
              title={`${s.username} ${categoryName(s.category)}`}
            >
              <img
                src={avatarUrl(streamer?.seed || s.username)}
                alt=""
                className="h-8 w-8 rounded-full bg-raised"
              />
              {open && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{streamer?.displayName || s.username}</div>
                    <div className="truncate text-[12px] text-mute">{categoryName(s.category)}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-mute">
                    <span className="h-1.5 w-1.5 rounded-full bg-volt" />
                    {formatViewers(s.viewers)}
                  </div>
                </>
              )}
            </NavLink>
          )
        })
        ) : (
          open && <p className="px-4 py-2 text-[13px] text-mute">No live channels yet.</p>
        )}
        {open && recommended.length > 10 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full px-3 py-2 text-left text-[13px] font-medium text-mute hover:text-white"
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
    </aside>
  )
}

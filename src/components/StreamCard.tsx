import { Link } from 'react-router-dom'
import { avatarUrl, categoryName, streamerByUsername } from '../data/catalog'
import { formatViewers } from '../lib/format'
import type { Stream } from '../types'

export function StreamCard({ stream }: { stream: Stream }) {
  const streamer = streamerByUsername(stream.username)
  return (
    <article className="group">
      <Link to={`/${stream.username}`} className="relative block overflow-hidden rounded-md bg-raised">
        {stream.videoUrl ? (
          <video
            src={stream.videoUrl}
            poster={stream.thumbnail}
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-video w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => {
              e.currentTarget.pause()
            }}
          />
        ) : stream.thumbnail ? (
          <img
            src={stream.thumbnail}
            alt=""
            className="aspect-video w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-900 to-ink text-volt">
            LIVE
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-[4px] bg-volt px-1.5 py-0.5 text-[11px] font-black tracking-wide text-black">
          LIVE
        </span>
        <span className="absolute bottom-2 left-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[12px] font-medium">
          {formatViewers(stream.viewers)} watching
        </span>
      </Link>
      <div className="mt-2 flex gap-2">
        <Link to={`/${stream.username}`} className="shrink-0">
          <img
            src={avatarUrl(streamer?.seed || stream.username)}
            alt=""
            className="h-9 w-9 rounded-full bg-raised"
          />
        </Link>
        <div className="min-w-0">
          <Link to={`/${stream.username}`} className="block text-[13px] font-semibold hover:text-volt">
            {streamer?.displayName || stream.username}
          </Link>
          <Link to={`/${stream.username}`} className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#d7dbde]">
            {stream.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Link
              to={`/directory/${stream.category}`}
              className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-mute hover:text-white"
            >
              {categoryName(stream.category)}
            </Link>
            {stream.language && (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-mute">{stream.language}</span>
            )}
            {stream.mature && (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-mute">18+</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

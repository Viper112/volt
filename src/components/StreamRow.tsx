import { Link } from 'react-router-dom'
import { StreamCard } from './StreamCard'
import type { Stream } from '../types'

export function StreamRow({
  title,
  to,
  streams,
}: {
  title: string
  to?: string
  streams: Stream[]
}) {
  if (!streams.length) return null
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {to && (
          <Link to={to} className="text-sm font-medium text-mute hover:text-white">
            View all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {streams.slice(0, 5).map((s) => (
          <StreamCard key={s.id} stream={s} />
        ))}
      </div>
    </section>
  )
}

import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { avatarUrl, categories, streamers } from '../data/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { StreamCard } from '../components/StreamCard'
import { useLive } from '../context/LiveContext'
import { formatFollowers } from '../lib/format'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim().toLowerCase()
  const { streams } = useLive()

  const results = useMemo(() => {
    if (!q) return { streams: [], categories: [], streamers: [] }
    return {
      streams: streams.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      ),
      categories: categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)),
      streamers: streamers.filter(
        (s) => s.username.includes(q) || s.displayName.toLowerCase().includes(q) || s.bio.toLowerCase().includes(q),
      ),
    }
  }, [q, streams])

  return (
    <div className="px-6 py-5">
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="mt-1 text-mute">{q ? `Results for “${q}”` : 'Type a query in the search bar.'}</p>

      {!!results.streamers.length && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Channels</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.streamers.map((s) => (
              <Link key={s.username} to={`/${s.username}`} className="flex items-center gap-3 rounded-md p-2 hover:bg-hover">
                <img src={avatarUrl(s.seed)} alt="" className="h-12 w-12 rounded-full" />
                <div>
                  <div className="font-semibold">{s.displayName}</div>
                  <div className="text-xs text-mute">{formatFollowers(s.followers)} followers</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!!results.categories.length && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Categories</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
            {results.categories.map((c) => (
              <div key={c.slug} className="w-[140px] shrink-0">
                <CategoryCard category={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!!results.streams.length && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Live</h2>
          <div className="mt-3 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.streams.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        </section>
      )}

      {q && !results.streams.length && !results.categories.length && !results.streamers.length && (
        <p className="mt-8 text-mute">No results. Try another search.</p>
      )}
    </div>
  )
}

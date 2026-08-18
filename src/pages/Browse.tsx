import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories, clips } from '../data/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { StreamCard } from '../components/StreamCard'
import { useLive } from '../context/LiveContext'
import { formatViewers } from '../lib/format'

const languages = ['All', 'English', 'Spanish', 'Arabic', 'Polish', 'Japanese']

export function Browse() {
  const { streams } = useLive()
  const loc = useLocation()
  const tab = loc.pathname.includes('/categories') ? 'categories' : loc.pathname.includes('/clips') ? 'clips' : 'live'
  const [lang, setLang] = useState('All')
  const [sort, setSort] = useState('viewers')

  const list = useMemo(() => {
    let rows = streams
    if (lang !== 'All') rows = rows.filter((s) => s.language === lang)
    if (sort === 'viewers') rows = [...rows].sort((a, b) => b.viewers - a.viewers)
    else rows = [...rows].sort((a, b) => a.title.localeCompare(b.title))
    return rows
  }, [streams, lang, sort])

  return (
    <div className="px-6 py-5">
      <h1 className="text-3xl font-bold">Browse</h1>
      <div className="mt-4 flex gap-6 border-b border-line text-sm font-semibold">
        {[
          { id: 'live', label: 'Livestreams', to: '/browse' },
          { id: 'categories', label: 'Categories', to: '/browse/categories' },
          { id: 'clips', label: 'Clips', to: '/browse/clips' },
        ].map((t) => (
          <Link
            key={t.id}
            to={t.to}
            className={`-mb-px border-b-2 pb-2 ${
              tab === t.id ? 'border-volt text-white' : 'border-transparent text-mute hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'live' && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm text-mute">
              Filter by:{' '}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="ml-1 rounded-md border border-line bg-raised px-2 py-1.5 text-white"
              >
                {languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-mute">
              Sort by:{' '}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="ml-1 rounded-md border border-line bg-raised px-2 py-1.5 text-white"
              >
                <option value="viewers">Viewers (High to Low)</option>
                <option value="az">Title (A-Z)</option>
              </select>
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      )}

      {tab === 'clips' && (
        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {clips.map((c) => (
            <Link key={c.id} to={`/${c.username}`} className="group">
              <div className="relative overflow-hidden rounded-md bg-raised">
                <img src={c.thumbnail} alt="" className="aspect-video w-full object-cover group-hover:scale-[1.03]" />
                <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs">
                  {formatViewers(c.views)} views
                </span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs">{c.duration}</span>
              </div>
              <div className="mt-2 text-sm font-semibold group-hover:text-volt">{c.title}</div>
              <div className="text-xs text-mute">
                {c.username} · {c.createdAt}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

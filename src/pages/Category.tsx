import { useParams, Link } from 'react-router-dom'
import { categories, categoryBySlug } from '../data/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { StreamCard } from '../components/StreamCard'
import { useLive } from '../context/LiveContext'
import { formatViewers } from '../lib/format'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { streams } = useLive()
  const category = categoryBySlug(slug)
  const list = streams.filter((s) => s.category === slug)
  const viewers = list.reduce((n, s) => n + s.viewers, 0)

  if (!category) {
    return <div className="p-8 text-mute">Category not found.</div>
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-end gap-5">
        <img src={category.image} alt="" className="h-40 w-[120px] rounded-md object-cover" />
        <div>
          <h1 className="text-4xl font-bold">{category.name}</h1>
          <p className="mt-2 text-mute">{formatViewers(viewers)} viewers</p>
          <div className="mt-3 flex gap-2">
            {category.tags.map((t) => (
              <span key={t} className="rounded-full bg-raised px-3 py-1 text-xs text-mute">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <h2 className="mt-8 text-lg font-bold">Live channels</h2>
      <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((s) => (
          <StreamCard key={s.id} stream={s} />
        ))}
      </div>
      {!list.length && <p className="mt-6 text-mute">Nobody is live in this category right now.</p>}
      <h2 className="mt-10 text-lg font-bold">More categories</h2>
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
        {categories
          .filter((c) => c.slug !== slug)
          .map((c) => (
            <div key={c.slug} className="w-[140px] shrink-0">
              <CategoryCard category={c} />
            </div>
          ))}
      </div>
      <Link to="/browse/categories" className="mt-4 inline-block text-sm text-mute hover:text-white">
        View all categories
      </Link>
    </div>
  )
}

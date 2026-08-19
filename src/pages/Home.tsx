import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { StreamRow } from '../components/StreamRow'
import { useLive } from '../context/LiveContext'

export function Home() {
  const { streams } = useLive()
  const liveCats = categories
    .map((c) => ({ ...c, count: streams.filter((s) => s.category === c.slug).length }))
    .filter((c) => c.count)
    .slice(0, 8)

  return (
    <div className="px-6 py-5">
      {streams.length ? (
        <FeaturedCarousel streams={streams} />
      ) : (
        <div className="rounded-lg border border-line bg-raised px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">Nobody is live yet</h1>
          <p className="mt-2 text-mute">When creators go live, they show up here. Be the first.</p>
          <Link to="/go-live" className="mt-5 inline-block rounded-md bg-volt px-4 py-2 font-bold text-black hover:bg-volt-dim">
            Go live
          </Link>
        </div>
      )}
      {!!liveCats.length && (
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">Top Live Categories</h2>
          <Link to="/browse/categories" className="text-sm font-medium text-mute hover:text-white">
            View all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {liveCats.map((c) => (
            <div key={c.slug} className="w-[150px] shrink-0">
              <CategoryCard category={c} />
            </div>
          ))}
        </div>
      </section>
      )}
      {liveCats.map((c) => (
        <StreamRow
          key={c.slug}
          title={c.name}
          to={`/directory/${c.slug}`}
          streams={streams.filter((s) => s.category === c.slug)}
        />
      ))}
    </div>
  )
}

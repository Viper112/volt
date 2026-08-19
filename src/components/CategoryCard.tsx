import { Link } from 'react-router-dom'
import { useLive } from '../context/LiveContext'
import { formatViewers } from '../lib/format'
import type { Category } from '../types'

export function CategoryCard({ category }: { category: Category }) {
  const { streams } = useLive()
  const viewers = streams.filter((s) => s.category === category.slug).reduce((n, s) => n + s.viewers, 0)
  return (
    <Link to={`/directory/${category.slug}`} className="group min-w-[140px] flex-1">
      <div className="overflow-hidden rounded-md bg-raised">
        <img
          src={category.image}
          alt=""
          className="aspect-[3/4] w-full object-cover transition duration-200 group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-2 truncate text-sm font-semibold group-hover:text-volt">{category.name}</div>
      <div className="text-[12px] text-mute">{formatViewers(viewers)} viewers</div>
    </Link>
  )
}

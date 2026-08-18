import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" fill="#53FC18" />
      </svg>
      {!compact && (
        <span className="text-[22px] font-black tracking-tight leading-none text-[#53FC18]">VOLT</span>
      )}
    </Link>
  )
}

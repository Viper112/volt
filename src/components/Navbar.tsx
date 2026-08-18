import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, LogOut, Radio, Search, User as UserIcon } from 'lucide-react'
import { Logo } from './Logo'
import { AuthModal } from './AuthModal'
import { useAuth } from '../context/AuthContext'
import { avatarUrl } from '../data/catalog'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)
  const [menu, setMenu] = useState(false)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-ink px-3">
        <Logo />
        <form onSubmit={onSearch} className="mx-auto flex w-full max-w-[560px] items-center">
          <div className="flex w-full items-center rounded-md border border-line bg-raised focus-within:border-mute">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="h-9 w-full bg-transparent px-3 text-sm outline-none placeholder:text-mute"
            />
            <button type="submit" className="grid h-9 w-10 place-items-center text-mute hover:text-white">
              <Search size={16} />
            </button>
          </div>
        </form>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-md p-2 text-mute hover:bg-hover hover:text-white sm:block" title="Language">
            <Globe size={18} />
          </button>
          {user ? (
            <>
              <Link
                to="/go-live"
                className="hidden items-center gap-1.5 rounded-md bg-raised px-3 py-1.5 text-sm font-semibold hover:bg-hover sm:flex"
              >
                <Radio size={15} className="text-volt" />
                Go Live
              </Link>
              <div className="relative">
                <button onClick={() => setMenu((v) => !v)} className="overflow-hidden rounded-full">
                  <img src={avatarUrl(user.username)} alt="" className="h-8 w-8 bg-raised" />
                </button>
                {menu && (
                  <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-lg border border-line bg-raised py-1 shadow-xl">
                    <div className="px-3 py-2 text-sm">
                      <div className="font-semibold">{user.displayName}</div>
                      <div className="text-mute">@{user.username}</div>
                    </div>
                    <Link
                      to={`/${user.username}`}
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover"
                    >
                      <UserIcon size={14} /> Channel
                    </Link>
                    <Link
                      to="/go-live"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover"
                    >
                      <Radio size={14} /> Creator dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenu(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setAuth('login')} className="px-3 py-1.5 text-sm font-semibold hover:text-mute">
                Log In
              </button>
              <button
                onClick={() => setAuth('signup')}
                className="rounded-md bg-volt px-3 py-1.5 text-sm font-bold text-black hover:bg-volt-dim"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />}
    </>
  )
}

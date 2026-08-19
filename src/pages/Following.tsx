import { useState } from 'react'
import { StreamCard } from '../components/StreamCard'
import { AuthModal } from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import { useLive } from '../context/LiveContext'
import { avatarUrl } from '../data/catalog'
import { Link } from 'react-router-dom'

export function Following() {
  const { user } = useAuth()
  const { streams } = useLive()
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">Follow your favorite creators</h1>
        <p className="mt-2 max-w-md text-mute">
          Log in to see live channels you follow, catch up on new streams, and keep your sidebar personal.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setAuth('login')} className="rounded-md px-4 py-2 font-semibold hover:bg-hover">
            Log In
          </button>
          <button
            onClick={() => setAuth('signup')}
            className="rounded-md bg-volt px-4 py-2 font-bold text-black hover:bg-volt-dim"
          >
            Sign Up
          </button>
        </div>
        {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />}
      </div>
    )
  }

  const following = user.following
  const live = streams.filter((s) => following.includes(s.username.toLowerCase()))
  const offline = following.filter((name) => !live.some((l) => l.username.toLowerCase() === name))

  return (
    <div className="px-6 py-5">
      <h1 className="text-3xl font-bold">Following</h1>
      <h2 className="mt-8 text-lg font-bold">Live now</h2>
      {live.length ? (
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {live.map((s) => (
            <StreamCard key={s.id} stream={s} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-mute">None of your follows are live. Check back soon.</p>
      )}
      {!!offline.length && (
        <>
          <h2 className="mt-10 text-lg font-bold">Offline</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {offline.map((name) => (
              <Link key={name} to={`/${name}`} className="flex items-center gap-3 rounded-md p-2 hover:bg-hover">
                <img src={avatarUrl(name)} alt="" className="h-12 w-12 rounded-full grayscale" />
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-mute">{name}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

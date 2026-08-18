import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: 'login' | 'signup'
  onClose: () => void
  onSwitch: (mode: 'login' | 'signup') => void
}) {
  const { login, register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-line bg-raised p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-mute hover:bg-hover hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm text-mute">
            Username
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-white outline-none focus:border-volt"
            />
          </label>
          <label className="block text-sm text-mute">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-white outline-none focus:border-volt"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-md bg-volt py-2.5 font-bold text-black hover:bg-volt-dim disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create account'}
          </button>
        </form>
        {mode === 'login' && (
          <p className="mt-3 text-xs text-mute">
            Demo account: <span className="text-white">demo</span> / <span className="text-white">demo123</span>
          </p>
        )}
        <p className="mt-4 text-sm text-mute">
          {mode === 'login' ? 'New to VOLT?' : 'Already have an account?'}{' '}
          <button
            className="font-semibold text-volt hover:underline"
            onClick={() => onSwitch(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  )
}

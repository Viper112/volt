import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginGate() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(username, password)
      else await register({ username, displayName, password, invite })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate">
      <div className="gate-atmosphere" aria-hidden />
      <div className="gate-panel animate-rise">
        <p className="brand-mark">WAR DOGS</p>
        <h1 className="gate-title">Pack channel</h1>
        <p className="gate-copy">
          Private chat for the crew. Sign in with your callsign — invite required to join.
        </p>

        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Join pack
          </button>
        </div>

        <form onSubmit={onSubmit} className="gate-form">
          <label>
            <span>Callsign</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={2}
              maxLength={20}
              placeholder="yourname"
            />
          </label>

          {mode === 'register' && (
            <label>
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
                placeholder="How the pack sees you"
              />
            </label>
          )}

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={4}
              placeholder="••••••••"
            />
          </label>

          {mode === 'register' && (
            <label>
              <span>Invite code</span>
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                required
                placeholder="Ask a dog"
                autoComplete="off"
              />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="cta" disabled={busy}>
            {busy ? 'Hold…' : mode === 'login' ? 'Enter kennel' : 'Claim callsign'}
          </button>
        </form>

        <p className="gate-hint">Demo: demo / demo123</p>
      </div>
    </div>
  )
}

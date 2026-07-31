import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

interface User {
  id: number
  email: string
}

export default function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  // seconds until "Resend code" can be used again — mirrors the
  // server's one-code-per-minute throttle
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    try {
      await apiFetch('/api/auth/request-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      const resent = step === 'code'
      setStep('code')
      setCooldown(60)
      setInfo(
        resent
          ? `A fresh code is on its way to ${email.trim()} — only the newest one works.`
          : `We sent a 6-digit code and a sign-in link to ${email.trim()}.`,
      )
    } catch (err) {
      // Throttled means a code was already sent moments ago (e.g. the
      // page was refreshed mid-login) — move to code entry instead of
      // dead-ending; the emailed code is still valid.
      if ((err as Error & { status?: number }).status === 429) {
        setStep('code')
        setCooldown(60)
        setInfo(`A code was sent to ${email.trim()} moments ago — check your email, or resend in a minute.`)
        return
      }
      setError((err as Error).message)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })
      onLogin(data.user)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="login">
      <h1>Ingrain</h1>
      <p className="muted">One small thing to revise, every day.</p>

      {step === 'email' ? (
        <form onSubmit={requestCode} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            autoFocus
          />
          <button type="submit" className="primary" disabled={!email.includes('@')}>
            Send me a code
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="login-form">
          {info && <p className="muted">{info}</p>}
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            aria-label="Code"
            autoFocus
          />
          <button type="submit" className="primary" disabled={code.trim().length !== 6}>
            Sign in
          </button>
          <div className="login-links">
            <button type="button" className="linklike" onClick={() => requestCode()} disabled={cooldown > 0}>
              {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
            </button>
            <button type="button" className="linklike" onClick={() => { setStep('email'); setCode(''); setInfo('') }}>
              Use a different email
            </button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  )
}

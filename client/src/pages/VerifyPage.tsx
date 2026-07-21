import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api'

interface User {
  id: number
  email: string
}

// Where the magic link lands: read ?token= and exchange it for a session.
export default function VerifyPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  // Tokens are single-use, and StrictMode runs effects twice in dev —
  // this ref makes sure we only spend the token once.
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const token = params.get('token') ?? ''
    apiFetch<{ user: User }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((data) => onLogin(data.user))
      .catch((err) => setError((err as Error).message))
  }, [params, onLogin])

  return (
    <main className="login">
      <h1>Ingrain</h1>
      {error ? (
        <>
          <p className="error">{error}</p>
          <p><Link to="/">Request a new code</Link></p>
        </>
      ) : (
        <p>Signing you in…</p>
      )}
    </main>
  )
}

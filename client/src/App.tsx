import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { apiFetch } from './api'
import TodayPage from './pages/TodayPage'
import ItemsPage from './pages/ItemsPage'
import JourneyPage from './pages/JourneyPage'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'

interface User {
  id: number
  email: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)

  // Theme: index.html already applied saved-or-system before first paint;
  // this state just mirrors <html data-theme> so the toggle icon is right.
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('ingrain-theme', next)
    setTheme(next)
  }

  // Until the user explicitly toggles, keep following live system changes
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (localStorage.getItem('ingrain-theme')) return
      const next = mq.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    mq.addEventListener('change', follow)
    return () => mq.removeEventListener('change', follow)
  }, [])

  // The auth gate: ask the server who we are. The session cookie rides
  // along automatically; a 401 just means "show the login screen".
  useEffect(() => {
    apiFetch<{ user: User }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true))
  }, [])

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Leave the UI logged out even if the request failed — the
      // session cookie will expire on its own.
    }
    setUser(null)
  }

  if (!checked) {
    return <main><p>Loading…</p></main>
  }

  return (
    <BrowserRouter>
      {user ? (
        <>
          <nav className="topnav">
            <NavLink to="/" className="brand" end>Ingrain</NavLink>
            <NavLink to="/" end>Today</NavLink>
            <NavLink to="/items">My items</NavLink>
            <NavLink to="/journey">Journey</NavLink>
            <span className="nav-user muted" title={user.email}>{user.email}</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button type="button" onClick={logout}>Log out</button>
          </nav>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/auth/verify" element={<VerifyPage onLogin={setUser} />} />
          <Route path="*" element={<LoginPage onLogin={setUser} />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}

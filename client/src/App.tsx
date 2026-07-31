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

  // The auth gate: ask the server who we are. The session cookie rides
  // along automatically; a 401 just means "show the login screen".
  useEffect(() => {
    apiFetch<{ user: User }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true))
  }, [])

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
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
            <span className="nav-user muted">{user.email}</span>
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

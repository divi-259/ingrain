import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import TodayPage from './pages/TodayPage'
import ItemsPage from './pages/ItemsPage'
import JourneyPage from './pages/JourneyPage'

export default function App() {
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

  return (
    <HashRouter>
      <nav className="topnav">
        <NavLink to="/" className="brand" end>Ingrain</NavLink>
        <NavLink to="/" end>Today</NavLink>
        <NavLink to="/items">My items</NavLink>
        <NavLink to="/journey">Journey</NavLink>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

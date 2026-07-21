import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import TodayPage from './pages/TodayPage'
import ItemsPage from './pages/ItemsPage'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="topnav">
        <span className="brand">Ingrain</span>
        <NavLink to="/" end>Today</NavLink>
        <NavLink to="/items">My items</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/items" element={<ItemsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

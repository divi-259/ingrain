import { useEffect, useState } from 'react'
import { apiFetch, localDate } from '../api'
import Heatmap from '../components/Heatmap'

interface History {
  completedDates: string[]
  streak: { current: number; best: number }
  totals: { daysCompleted: number; revisions: number; activeItems: number }
}

const WEEKS = 26 // half a year of columns fits the 640px layout

export default function JourneyPage() {
  const [history, setHistory] = useState<History | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<History>(`/api/history?date=${localDate()}`)
      .then(setHistory)
      .catch((err) => setError((err as Error).message))
  }, [])

  if (error) return <main><h1>Journey</h1><p className="error">{error}</p></main>
  if (!history) return <main><p>Loading…</p></main>

  return (
    <main>
      <h1>Journey</h1>

      <div className="stat-row">
        <div className="stat"><span className="stat-value">{history.totals.daysCompleted}</span><span className="muted">days completed</span></div>
        <div className="stat"><span className="stat-value">{history.streak.current > 0 ? `🔥 ${history.streak.current}` : '—'}</span><span className="muted">current streak</span></div>
        <div className="stat"><span className="stat-value">{history.streak.best}</span><span className="muted">best streak</span></div>
        <div className="stat"><span className="stat-value">{history.totals.revisions}</span><span className="muted">revisions</span></div>
      </div>

      <Heatmap completedDates={history.completedDates} weeks={WEEKS} />
      <p className="muted">Last {WEEKS} weeks — each square is a day; green means you revised.</p>
    </main>
  )
}

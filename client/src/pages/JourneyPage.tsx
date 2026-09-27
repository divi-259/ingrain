import { useEffect, useState } from 'react'
import { localDate } from '../lib/format'
import { getHistory, type History } from '../lib/store'
import Heatmap from '../components/Heatmap'

const WEEKS = 26 // half a year of columns fits the 640px layout

export default function JourneyPage() {
  const [history, setHistory] = useState<History | null>(null)

  useEffect(() => {
    setHistory(getHistory(localDate()))
  }, [])

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

import { useEffect, useState } from 'react'
import { apiFetch, localDate } from '../api'

interface History {
  completedDates: string[]
  streak: { current: number; best: number }
  totals: { daysCompleted: number; revisions: number; activeItems: number }
}

const WEEKS = 26 // half a year of columns fits the 640px layout

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Columns of 7 days each, Sunday-first, ending at the week containing
// `today` — the same shape as a GitHub contribution graph.
function buildWeeks(today: string): string[][] {
  const [y, m, d] = today.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  cursor.setDate(cursor.getDate() - cursor.getDay() - (WEEKS - 1) * 7)
  return Array.from({ length: WEEKS }, () =>
    Array.from({ length: 7 }, () => {
      const day = fmt(cursor)
      cursor.setDate(cursor.getDate() + 1)
      return day
    }),
  )
}

// Label a column when the 1st of a month falls inside it
function monthLabel(week: string[]): string {
  const first = week.find((day) => day.endsWith('-01'))
  return first ? MONTHS[Number(first.slice(5, 7)) - 1] : ''
}

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

  const today = localDate()
  const done = new Set(history.completedDates)
  const weeks = buildWeeks(today)

  return (
    <main>
      <h1>Journey</h1>

      <div className="stat-row">
        <div className="stat"><span className="stat-value">🔥 {history.streak.current}</span><span className="muted">current streak</span></div>
        <div className="stat"><span className="stat-value">{history.streak.best}</span><span className="muted">best streak</span></div>
        <div className="stat"><span className="stat-value">{history.totals.daysCompleted}</span><span className="muted">days completed</span></div>
        <div className="stat"><span className="stat-value">{history.totals.revisions}</span><span className="muted">revisions</span></div>
      </div>

      <div className="heatmap">
        {weeks.map((week, i) => (
          <div key={i} className="heatmap-col">
            <span className="heatmap-month muted">{monthLabel(week)}</span>
            {week.map((day) => (
              <span
                key={day}
                className={
                  day > today ? 'heatmap-cell future'
                  : done.has(day) ? 'heatmap-cell done'
                  : 'heatmap-cell'
                }
                title={`${day}${done.has(day) ? ' · revised' : day > today ? '' : ' · missed'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="muted">Last {WEEKS} weeks — each square is a day; green means you revised.</p>
    </main>
  )
}

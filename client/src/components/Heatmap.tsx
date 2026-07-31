import { useEffect, useRef } from 'react'
import { localDate } from '../api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Columns of 7 days each, Sunday-first, ending at the week containing
// `today` — the same shape as a GitHub contribution graph.
function buildWeeks(today: string, weeks: number): string[][] {
  const [y, m, d] = today.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  cursor.setDate(cursor.getDate() - cursor.getDay() - (weeks - 1) * 7)
  return Array.from({ length: weeks }, () =>
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

export default function Heatmap({ completedDates, weeks }: { completedDates: string[]; weeks: number }) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Start scrolled to the newest weeks so today is always visible
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [completedDates, weeks])

  const today = localDate()
  const done = new Set(completedDates)
  // Days before the first completion aren't "missed" — the user simply
  // wasn't here yet. No first completion → nothing is missed yet.
  const firstDone = completedDates.length ? [...completedDates].sort()[0] : today

  const cellTitle = (day: string) => {
    if (day > today || day < firstDone) return day
    return `${day} · ${done.has(day) ? 'revised' : 'missed'}`
  }

  return (
    <div className="heatmap" ref={ref}>
      {buildWeeks(today, weeks).map((week, i) => (
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
              title={cellTitle(day)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

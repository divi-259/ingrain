import { useEffect, useRef } from 'react'
import { localDate } from '../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface Column {
  label: string // month name on the first column of that month, '' otherwise
  days: (string | null)[] // 7 entries, Sunday first; null = no cell here (before
  // the lookback window, or padding so the month's first/last week aligns
  // to the Sun-Sat grid) — never a real date from a different month.
}

// One entry per week-column, grouped so every column belongs to exactly one
// calendar month — a week straddling a month boundary becomes two columns
// (the tail of the old month, padded with blanks; the head of the new
// month, also padded with blanks) instead of one column mixing both.
function buildColumns(today: string, weeks: number): Column[] {
  const [y, m, d] = today.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  const start = new Date(y, m - 1, d)
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7)

  const firstMonth = new Date(start.getFullYear(), start.getMonth(), 1)
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  const columns: Column[] = []

  for (
    let mc = new Date(firstMonth);
    mc <= lastMonth;
    mc = new Date(mc.getFullYear(), mc.getMonth() + 1, 1)
  ) {
    const year = mc.getFullYear()
    const month = mc.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = new Date(year, month, 1).getDay()

    let col: (string | null)[] = new Array(firstWeekday).fill(null)
    let isFirstColOfMonth = true

    const flush = () => {
      columns.push({ label: isFirstColOfMonth ? MONTHS[month] : '', days: col })
      isFirstColOfMonth = false
      col = []
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      col.push(date < start ? null : fmt(date))
      if (col.length === 7) flush()
    }
    if (col.length > 0) {
      while (col.length < 7) col.push(null)
      flush()
    }
  }

  return columns
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
      {buildColumns(today, weeks).map((col, i) => (
        <div key={i} className="heatmap-col">
          <span className="heatmap-month muted">{col.label}</span>
          {col.days.map((day, j) =>
            day === null ? (
              <span key={j} className="heatmap-cell blank" aria-hidden="true" />
            ) : (
              <span
                key={j}
                className={
                  day > today ? 'heatmap-cell future'
                  : done.has(day) ? 'heatmap-cell done'
                  : 'heatmap-cell'
                }
                title={cellTitle(day)}
              />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

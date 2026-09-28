// Pure display helpers shared across pages. No data access here —
// see store.ts for that.
import type { MascotExpression } from '../components/Mascot'

// Picks a streak-appropriate mascot expression so completions feel earned
// rather than identical every time: no streak yet is calmer than a
// multi-day run.
export function mascotForStreak(current: number): MascotExpression {
  if (current >= 3) return 'excited'
  if (current >= 1) return 'happy'
  return 'calm'
}

// The browser's local calendar date, e.g. "2026-07-20". This defines
// what "today" means for the daily pick.
export function localDate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// True when the timestamp falls on the browser's current calendar day
export function isToday(iso: string): boolean {
  const [y, m, d] = localDate().split('-').map(Number)
  const start = new Date(y, m - 1, d).getTime()
  const t = Date.parse(iso)
  return t >= start && t < start + 86_400_000
}

// A compact label for an item's link: its hostname ("youtube.com"),
// falling back to the raw string if it doesn't parse as a URL.
export function linkLabel(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

// "never" / "today" / "yesterday" / "N days ago"
export function daysAgoLabel(iso: string | null): string {
  if (!iso) return 'never'
  const then = new Date(iso)
  const [y, m, d] = localDate().split('-').map(Number)
  const startOfToday = new Date(y, m - 1, d).getTime()
  if (then.getTime() >= startOfToday) return 'today'
  const days = Math.ceil((startOfToday - then.getTime()) / 86_400_000)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

// Shape of an item as the server returns it
export interface Item {
  id: number
  title: string
  notes: string
  createdAt: string
  archivedAt: string | null
  lastRevisedAt: string | null
  revisionCount: number
}

// One wrapper for every API call: sets JSON headers, parses the
// response, and throws the server's { error } message on failure.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.error ?? `request failed (${res.status})`) as Error & { status: number }
    err.status = res.status
    throw err
  }
  return body as T
}

// The browser's local calendar date, e.g. "2026-07-20". This — not the
// server's clock — defines what "today" means for the daily pick.
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

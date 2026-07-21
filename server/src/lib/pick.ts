export interface Candidate {
  id: number
  createdAt: string
  lastRevisedAt: string | null
}

// Whole days between a UTC timestamp and the user's local calendar
// date (clamped at 0, so future timestamps don't go negative).
export function daysSince(iso: string, date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const dateMs = Date.UTC(y, m - 1, d)
  return Math.max(0, Math.floor((dateMs - Date.parse(iso)) / 86_400_000))
}

// Revised items: the longer neglected, the heavier. Never-revised
// items get a +3 boost so new additions enter the rotation quickly.
export function weightFor(c: Candidate, date: string): number {
  return c.lastRevisedAt
    ? daysSince(c.lastRevisedAt, date) + 1
    : daysSince(c.createdAt, date) + 3
}

export function pickWeighted(
  candidates: Candidate[],
  date: string,
  random: () => number = Math.random,
): Candidate | null {
  if (candidates.length === 0) return null
  const weights = candidates.map((c) => weightFor(c, date))
  let r = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r < 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

export interface Streak {
  current: number // consecutive days ending today (or yesterday, if today isn't done yet)
  best: number // longest run ever
}

const DAY_MS = 86_400_000

function toMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// `dates` are completed-pick days ('YYYY-MM-DD'), any order, duplicates ok.
// An incomplete "today" doesn't break the current streak — it stays alive
// until the day actually passes without a completion.
export function computeStreak(dates: string[], today: string): Streak {
  const days = [...new Set(dates.filter((d) => d <= today))].sort()

  let best = 0
  let run = 0
  let prevMs = NaN
  for (const day of days) {
    const ms = toMs(day)
    run = ms - prevMs === DAY_MS ? run + 1 : 1
    if (run > best) best = run
    prevMs = ms
  }

  // `run` is now the streak ending at the most recent completed day;
  // it only counts as current if that day is today or yesterday.
  const current = days.length > 0 && toMs(today) - prevMs <= DAY_MS ? run : 0
  return { current, best }
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, daysAgoLabel, localDate } from '../api'

interface Pick {
  date: string
  item: {
    id: number
    title: string
    notes: string
    lastRevisedAt: string | null
    revisionCount: number
  }
  lastNote: { note: string; revisedAt: string } | null
  why: { multiplier: number; neverRevised: boolean; candidates: number } | null
  skipAvailable: boolean
  completed: boolean
}

interface Streak {
  current: number
  best: number
}

interface TodayResponse {
  pick: Pick | null
  streak: Streak
}

export default function TodayPage() {
  const [pick, setPick] = useState<Pick | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [note, setNote] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await apiFetch<TodayResponse>(`/api/today?date=${localDate()}`)
      setPick(data.pick)
      setStreak(data.streak)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function markDone() {
    try {
      const data = await apiFetch<TodayResponse>('/api/today/done', {
        method: 'POST',
        body: JSON.stringify({ date: localDate(), note }),
      })
      setPick(data.pick)
      setStreak(data.streak)
      setNote('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function skip() {
    try {
      const data = await apiFetch<TodayResponse>('/api/today/skip', {
        method: 'POST',
        body: JSON.stringify({ date: localDate() }),
      })
      setPick(data.pick)
      setStreak(data.streak)
      setNote('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!loaded) return <main><p>Loading…</p></main>

  if (!pick) {
    return (
      <main>
        <h1>Today</h1>
        <p className="muted">
          Nothing to pick from yet — <Link to="/items">add your first item</Link> and come back.
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Today</h1>
      {streak && streak.current > 0 && (
        <p className="streak">
          🔥 {streak.current}-day streak
          {streak.best > streak.current && (
            <span className="muted"> · best {streak.best}</span>
          )}
        </p>
      )}
      {streak && streak.current === 0 && streak.best > 1 && (
        <p className="streak muted">
          best streak {streak.best} days — start a new one today
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="today-card">
        <h2>{pick.item.title}</h2>
        {pick.item.notes && <p>{pick.item.notes}</p>}
        <p className="muted">
          last revised {daysAgoLabel(pick.item.lastRevisedAt)}
          {pick.item.revisionCount > 0 && ` · revised ${pick.item.revisionCount}×`}
        </p>

        {pick.completed ? (
          <p className="done-note">
            {streak && streak.current > 1
              ? `Done for today 🎉 — that's ${streak.current} days in a row. Come back tomorrow to make it ${streak.current + 1}.`
              : 'Done for today 🎉 — come back tomorrow to start a streak.'}
          </p>
        ) : (
          <>
            {pick.why && (
              <p className="muted">
                Why this one?{' '}
                {pick.why.candidates === 1
                  ? "It's the only item in rotation."
                  : pick.why.neverRevised
                    ? `Never revised yet — new items get a head start (${pick.why.multiplier}× the average odds today).`
                    : `Its neglect gave it ${pick.why.multiplier}× the average odds today.`}
              </p>
            )}
            {pick.lastNote && (
              <blockquote className="last-note">
                Last time you noted: “{pick.lastNote.note}”
              </blockquote>
            )}
            <textarea
              className="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="One thing you remembered or re-learned (optional)"
              rows={2}
            />
            <div className="today-actions">
              <button type="button" className="primary" onClick={markDone}>
                Done — I revised it
              </button>
              {pick.skipAvailable ? (
                <button type="button" onClick={skip} title="You get one skip per day">
                  Skip (1 per day)
                </button>
              ) : (
                <span className="muted">skip used for today</span>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

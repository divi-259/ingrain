import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, daysAgoLabel, isToday, localDate, type Item } from '../api'
import Heatmap from '../components/Heatmap'

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

interface History {
  completedDates: string[]
  streak: Streak
  totals: { daysCompleted: number; revisions: number; activeItems: number }
}

export default function TodayPage() {
  const [pick, setPick] = useState<Pick | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [note, setNote] = useState('')
  const [submittedNote, setSubmittedNote] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false) // a Done/Skip request is in flight
  const [error, setError] = useState('')

  // The side rail: history feeds the stats + mini heatmap, items feed
  // the "in rotation" glance. Both are enrichment — if they fail, the
  // page still works, so their errors are swallowed.
  const [history, setHistory] = useState<History | null>(null)
  const [items, setItems] = useState<Item[]>([])

  async function loadRail() {
    apiFetch<History>(`/api/history?date=${localDate()}`).then(setHistory).catch(() => {})
    apiFetch<{ items: Item[] }>('/api/items').then((d) => setItems(d.items)).catch(() => {})
  }

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
    loadRail()
  }, [])

  async function markDone() {
    if (busy) return
    setBusy(true)
    try {
      const data = await apiFetch<TodayResponse>('/api/today/done', {
        method: 'POST',
        body: JSON.stringify({ date: localDate(), note }),
      })
      setPick(data.pick)
      setStreak(data.streak)
      setSubmittedNote(note.trim())
      setNote('')
      loadRail() // today just turned green — refresh stats + heatmap
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function skip() {
    if (busy) return
    setBusy(true)
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
    } finally {
      setBusy(false)
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

  // The note behind today's completion: what was just typed, or — after a
  // reload — the server's lastNote when it was written today.
  const completedNote =
    submittedNote ||
    (pick.lastNote && isToday(pick.lastNote.revisedAt) ? pick.lastNote.note : '')

  // The 3 items the lottery is most likely to serve next — the ones
  // untouched the longest (never-revised items sort by creation).
  const rotation = [...items]
    .sort((a, b) => (a.lastRevisedAt ?? a.createdAt).localeCompare(b.lastRevisedAt ?? b.createdAt))
    .slice(0, 3)

  return (
    <main className="today-main">
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

      <div className="today-layout">
      <div className="today-card">
        <h2>{pick.item.title}</h2>
        {pick.item.notes && <p>{pick.item.notes}</p>}
        <p className="muted">
          last revised {daysAgoLabel(pick.item.lastRevisedAt)}
          {pick.item.revisionCount > 0 && ` · revised ${pick.item.revisionCount}×`}
        </p>

        {pick.completed ? (
          <>
            <p className="done-note">
              {streak && streak.current > 1
                ? `Done for today 🎉 — that's ${streak.current} days in a row. Come back tomorrow to make it ${streak.current + 1}.`
                : `Done for today 🎉 — that's day 1. Come back tomorrow to make it 2.`}
            </p>
            {completedNote && (
              <blockquote className="last-note">
                You noted: “{completedNote}”
              </blockquote>
            )}
          </>
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
              aria-label="Revision note"
              maxLength={500}
              rows={2}
            />
            <div className="today-actions">
              <button type="button" className="primary" onClick={markDone} disabled={busy}>
                Done — I revised it
              </button>
              {pick.skipAvailable ? (
                <button type="button" onClick={skip} disabled={busy} title="You get one skip per day">
                  Skip (1 per day)
                </button>
              ) : (
                <span className="muted">skip used for today</span>
              )}
            </div>
          </>
        )}
      </div>

      <aside className="rail">
        {history && (
          <div className="stat-row">
            <div className="stat">
              <span className="stat-value">{history.streak.current > 0 ? `🔥 ${history.streak.current}` : '—'}</span>
              <span className="muted">streak</span>
            </div>
            <div className="stat">
              <span className="stat-value">{history.totals.daysCompleted}</span>
              <span className="muted">days</span>
            </div>
            <div className="stat">
              <span className="stat-value">{history.totals.revisions}</span>
              <span className="muted">revisions</span>
            </div>
          </div>
        )}

        {history && (
          <div>
            <h2 className="rail-title">Last 8 weeks</h2>
            <Heatmap completedDates={history.completedDates} weeks={8} />
            <Link to="/journey" className="rail-link">Full journey →</Link>
          </div>
        )}

        {rotation.length > 0 && (
          <div>
            <h2 className="rail-title">In rotation</h2>
            <ul className="rotation-list">
              {rotation.map((item) => (
                <li key={item.id}>
                  <span className="rotation-title">{item.title}</span>
                  <span className="muted">{daysAgoLabel(item.lastRevisedAt)}</span>
                </li>
              ))}
            </ul>
            {items.length > 3 && (
              <Link to="/items" className="rail-link">All {items.length} items →</Link>
            )}
          </div>
        )}
      </aside>
      </div>
    </main>
  )
}

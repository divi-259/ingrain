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
  skipAvailable: boolean
  completed: boolean
}

export default function TodayPage() {
  const [pick, setPick] = useState<Pick | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await apiFetch<{ pick: Pick | null }>(`/api/today?date=${localDate()}`)
      setPick(data.pick)
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
      const data = await apiFetch<{ pick: Pick }>('/api/today/done', {
        method: 'POST',
        body: JSON.stringify({ date: localDate() }),
      })
      setPick(data.pick)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function skip() {
    try {
      const data = await apiFetch<{ pick: Pick }>('/api/today/skip', {
        method: 'POST',
        body: JSON.stringify({ date: localDate() }),
      })
      setPick(data.pick)
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
      {error && <p className="error">{error}</p>}

      <div className="today-card">
        <h2>{pick.item.title}</h2>
        {pick.item.notes && <p>{pick.item.notes}</p>}
        <p className="muted">
          last revised {daysAgoLabel(pick.item.lastRevisedAt)}
          {pick.item.revisionCount > 0 && ` · revised ${pick.item.revisionCount}×`}
        </p>

        {pick.completed ? (
          <p className="done-note">Done for today 🎉 — come back tomorrow.</p>
        ) : (
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
        )}
      </div>
    </main>
  )
}

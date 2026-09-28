import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { daysAgoLabel, isToday, linkLabel, localDate, mascotForStreak } from '../lib/format'
import { completeToday, getHistory, getToday, skipToday, type History, type Pick, type Streak } from '../lib/store'
import Heatmap from '../components/Heatmap'
import Linkify from '../components/Linkify'
import StatCard from '../components/StatCard'
import MountainIcon from '../components/MountainIcon'
import Mascot from '../components/Mascot'
import { randomQuote } from '../lib/quotes'
import heroImage from '../assets/today-hero.webp'

// The illustrated banner: same on every Today visit, in both themes —
// it's a decorative daytime scene, not something that needs a dark twin.
function TodayHero() {
  return (
    <div className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-scrim">
        <h1 className="hero-title">Today</h1>
        <p className="hero-tagline">Learn today. Build a brighter tomorrow.</p>
      </div>
    </div>
  )
}

export default function TodayPage() {
  const [pick, setPick] = useState<Pick | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [note, setNote] = useState('')
  const [submittedNote, setSubmittedNote] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  // Picked once per page load — no fetch needed, the quote library ships
  // with the app.
  const [quote] = useState(() => randomQuote())

  // The side rail: history feeds the stats + mini heatmap.
  const [history, setHistory] = useState<History | null>(null)

  // The draw reveal: hide the card behind a brief "drawing…" cover, then
  // flip it over. Once per day per browser session; a skip always re-draws
  // (it's a genuinely new card); completed picks and reduced-motion users
  // get the card instantly.
  const [phase, setPhase] = useState<'drawing' | 'flip' | 'plain'>('plain')

  function runReveal(date: string, force = false) {
    const key = `ingrain-reveal-${date}`
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || (!force && sessionStorage.getItem(key))) return
    sessionStorage.setItem(key, '1')
    setPhase('drawing')
    window.setTimeout(() => setPhase('flip'), 900)
  }

  function loadRail() {
    setHistory(getHistory(localDate()))
  }

  function load() {
    try {
      const data = getToday(localDate())
      setPick(data.pick)
      setStreak(data.streak)
      setError('')
      if (data.pick && !data.pick.completed) runReveal(data.pick.date)
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

  function markDone() {
    try {
      const data = completeToday(localDate(), note)
      setPick(data.pick)
      setStreak(data.streak)
      setSubmittedNote(note.trim())
      setNote('')
      loadRail() // today just turned green — refresh stats + heatmap
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function skip() {
    try {
      const data = skipToday(localDate())
      setPick(data.pick)
      setStreak(data.streak)
      setNote('')
      if (data.pick) runReveal(data.pick.date, true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!loaded) return <main><p>Loading…</p></main>

  if (!pick) {
    return (
      <main>
        <TodayHero />
        <div className="empty-moment">
          <Mascot expression="curious" size={64} />
          <p className="muted">
            Nothing to pick from yet — <Link to="/items">add your first item</Link> and come back.
          </p>
        </div>
      </main>
    )
  }

  // The note behind today's completion: what was just typed, or — after a
  // reload — the stored lastNote when it was written today.
  const completedNote =
    submittedNote ||
    (pick.lastNote && isToday(pick.lastNote.revisedAt) ? pick.lastNote.note : '')

  return (
    <main className="today-main">
      <TodayHero />
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
      {phase === 'drawing' ? (
        <div className="today-card card-back">
          <span className="card-back-emoji" aria-hidden="true">🎴</span>
          <p className="muted">Drawing today's card…</p>
        </div>
      ) : (
      <div className={phase === 'flip' ? 'today-card card-flip' : 'today-card'}>
        <div className="card-heading">
          <button
            type="button"
            className={pick.completed ? 'item-checkbox checked' : 'item-checkbox'}
            onClick={pick.completed ? undefined : markDone}
            disabled={pick.completed}
            aria-label={pick.completed ? 'Completed today' : 'Mark as done'}
          >
            {pick.completed && '✓'}
          </button>
          <h2>{pick.item.title}</h2>
          <span className="badge-today">Today</span>
        </div>
        {pick.item.notes && <p>{pick.item.notes}</p>}
        <p className="muted">
          last revised {daysAgoLabel(pick.item.lastRevisedAt)}
          {pick.item.revisionCount > 0 && ` · revised ${pick.item.revisionCount}×`}
        </p>
        {pick.item.link && (
          <p>
            <a className="today-link" href={pick.item.link} target="_blank" rel="noreferrer">
              Open {linkLabel(pick.item.link)} ↗
            </a>
          </p>
        )}

        {pick.completed ? (
          <>
            <div className="done-row">
              <Mascot expression={mascotForStreak(streak?.current ?? 0)} size={48} />
              <p className="done-note">
                {streak && streak.current > 1
                  ? `Done for today 🎉 — that's ${streak.current} days in a row. Come back tomorrow to make it ${streak.current + 1}.`
                  : `Done for today 🎉 — that's day 1. Come back tomorrow to make it 2.`}
              </p>
            </div>
            {completedNote && (
              <blockquote className="last-note">
                You noted: “<Linkify text={completedNote} />”
              </blockquote>
            )}
          </>
        ) : (
          <>
            {pick.why && (
              <p className="muted why-row">
                <Mascot expression="thinking" size={28} />
                <span>
                  Why this one?{' '}
                  {pick.why.candidates === 1
                    ? "It's the only item in rotation."
                    : pick.why.neverRevised
                      ? `Never revised yet — new items get a head start (${pick.why.multiplier}× the average odds today).`
                      : `Its neglect gave it ${pick.why.multiplier}× the average odds today.`}
                </span>
              </p>
            )}
            {pick.lastNote && (
              <blockquote className="last-note">
                Last time you noted: “<Linkify text={pick.lastNote.note} />”
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
              <Mascot expression="letsgo" size={40} />
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
      )}

      <aside className="rail">
        {history && (
          <div className="stat-row">
            <StatCard icon="🔥" tone="apricot" value={history.streak.current > 0 ? history.streak.current : '—'} label="streak" />
            <StatCard icon="📅" tone="teal" value={history.totals.daysCompleted} label="days" />
            <StatCard icon="🔁" tone="sage" value={history.totals.revisions} label="revisions" />
          </div>
        )}

        {history && (
          <div>
            <div className="rail-title-row">
              <h2 className="rail-title">Last 8 weeks</h2>
              <span className="handwritten">Progress lives here.</span>
            </div>
            <Heatmap completedDates={history.completedDates} weeks={8} />
            <Link to="/journey" className="rail-link">Full journey →</Link>
          </div>
        )}
      </aside>
      </div>

      <div className="quote-banner">
        <MountainIcon className="quote-mountain" />
        <div>
          <p className="quote-text">"{quote.text}"</p>
          <p className="muted">— {quote.author}</p>
        </div>
      </div>
    </main>
  )
}

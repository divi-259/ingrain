import { useEffect, useState } from 'react'
import { localDate, mascotForStreak } from '../lib/format'
import { getHistory, type History } from '../lib/store'
import Heatmap from '../components/Heatmap'
import StatCard from '../components/StatCard'
import Mascot from '../components/Mascot'
import MountainIcon from '../components/MountainIcon'
import PageBackdrop from '../components/PageBackdrop'
import { randomQuote } from '../lib/quotes'

const WEEKS = 26 // half a year of columns fits the 640px layout

export default function JourneyPage() {
  const [history, setHistory] = useState<History | null>(null)

  // Picked once per page load, same as Today's closing banner.
  const [quote] = useState(() => randomQuote())

  useEffect(() => {
    setHistory(getHistory(localDate()))
  }, [])

  if (!history) return <main><p>Loading…</p></main>

  return (
    <>
      <PageBackdrop />
      <main className="journey-main">
        <div className="journey-heading">
          <h1>Journey</h1>
          <Mascot expression={mascotForStreak(history.streak.current)} size={56} />
        </div>

        <div className="stat-row">
          <StatCard icon="📅" tone="teal" value={history.totals.daysCompleted} label="days completed" />
          <StatCard icon="🔥" tone="apricot" value={history.streak.current > 0 ? history.streak.current : '—'} label="current streak" />
          <StatCard icon="🏆" tone="sage" value={history.streak.best} label="best streak" />
          <StatCard icon="🔁" tone="teal" value={history.totals.revisions} label="revisions" />
        </div>

        <Heatmap completedDates={history.completedDates} weeks={WEEKS} />
        <p className="muted">Last {WEEKS} weeks — each square is a day; green means you revised.</p>

        <div className="quote-banner">
          <MountainIcon className="quote-mountain" />
          <div>
            <p className="quote-text">"{quote.text}"</p>
            <p className="muted">— {quote.author}</p>
          </div>
        </div>
      </main>
    </>
  )
}

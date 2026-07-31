import { Router } from 'express'
import { db } from '../db.js'
import { computeStreak } from '../lib/streak.js'

export const historyRouter = Router()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Everything the Journey page needs in one response: which days were
// completed (for the heatmap) plus streaks and lifetime totals.
historyRouter.get('/', async (req, res) => {
  const userId = req.user!.id
  const date = String(req.query.date ?? '')
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date=YYYY-MM-DD is required' })
    return
  }

  const completed = await db.execute({
    sql: 'SELECT date FROM daily_picks WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY date',
    args: [userId],
  })
  const completedDates = completed.rows.map((r) => String(r.date))

  const counts = await db.execute({
    sql: `SELECT
            (SELECT COUNT(*) FROM revisions r JOIN items i ON i.id = r.item_id
             WHERE i.user_id = ?) AS revisions,
            (SELECT COUNT(*) FROM items WHERE user_id = ? AND archived_at IS NULL) AS activeItems`,
    args: [userId, userId],
  })
  const row = counts.rows[0] as unknown as { revisions: number; activeItems: number }

  res.json({
    completedDates,
    streak: computeStreak(completedDates, date),
    totals: {
      daysCompleted: completedDates.filter((d) => d <= date).length,
      revisions: row.revisions,
      activeItems: row.activeItems,
    },
  })
})

import { Router } from 'express'
import { db, now } from '../db.js'
import { pickWeighted, type Candidate } from '../lib/pick.js'

export const todayRouter = Router()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

interface PickRow {
  id: number
  date: string
  item_id: number
  skipped_item_id: number | null
  completed_at: string | null
}

async function activeCandidates(userId: number, excludeItemId?: number): Promise<Candidate[]> {
  const result = await db.execute({
    sql: `SELECT i.id, i.created_at AS createdAt, MAX(r.revised_at) AS lastRevisedAt
          FROM items i LEFT JOIN revisions r ON r.item_id = i.id
          WHERE i.user_id = ? AND i.archived_at IS NULL
          GROUP BY i.id`,
    args: [userId],
  })
  const rows = result.rows as unknown as Candidate[]
  return excludeItemId ? rows.filter((r) => r.id !== excludeItemId) : rows
}

async function getPickRow(userId: number, date: string): Promise<PickRow | undefined> {
  const result = await db.execute({
    sql: 'SELECT * FROM daily_picks WHERE user_id = ? AND date = ?',
    args: [userId, date],
  })
  return result.rows[0] as unknown as PickRow | undefined
}

async function pickResponse(row: PickRow) {
  const result = await db.execute({
    sql: `SELECT i.id, i.title, i.notes,
                 MAX(r.revised_at) AS lastRevisedAt,
                 COUNT(r.id) AS revisionCount
          FROM items i LEFT JOIN revisions r ON r.item_id = i.id
          WHERE i.id = ? GROUP BY i.id`,
    args: [row.item_id],
  })
  return {
    pick: {
      date: row.date,
      item: result.rows[0],
      skipAvailable: row.skipped_item_id === null,
      completed: row.completed_at !== null,
    },
  }
}

todayRouter.get('/', async (req, res) => {
  const userId = req.user!.id
  const date = String(req.query.date ?? '')
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date=YYYY-MM-DD is required' })
    return
  }

  let row = await getPickRow(userId, date)
  if (!row) {
    const chosen = pickWeighted(await activeCandidates(userId), date)
    if (!chosen) {
      res.json({ pick: null })
      return
    }
    // OR IGNORE + re-read: if two requests race, the UNIQUE(user_id, date)
    // constraint lets exactly one insert win and both read the same row.
    await db.execute({
      sql: `INSERT OR IGNORE INTO daily_picks (user_id, date, item_id, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [userId, date, chosen.id, now()],
    })
    row = (await getPickRow(userId, date))!
  }
  res.json(await pickResponse(row))
})

todayRouter.post('/skip', async (req, res) => {
  const userId = req.user!.id
  const date = String(req.body.date ?? '')
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date=YYYY-MM-DD is required' })
    return
  }
  const row = await getPickRow(userId, date)
  if (!row) {
    res.status(409).json({ error: 'no pick for this date yet' })
    return
  }
  if (row.completed_at !== null) {
    res.status(409).json({ error: 'already completed today' })
    return
  }
  if (row.skipped_item_id !== null) {
    res.status(409).json({ error: 'skip already used today' })
    return
  }
  const chosen = pickWeighted(await activeCandidates(userId, row.item_id), date)
  if (!chosen) {
    res.status(409).json({ error: 'no other items to swap to' })
    return
  }
  await db.execute({
    sql: 'UPDATE daily_picks SET item_id = ?, skipped_item_id = ? WHERE id = ?',
    args: [chosen.id, row.item_id, row.id],
  })
  res.json(await pickResponse((await getPickRow(userId, date))!))
})

todayRouter.post('/done', async (req, res) => {
  const userId = req.user!.id
  const date = String(req.body.date ?? '')
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date=YYYY-MM-DD is required' })
    return
  }
  const row = await getPickRow(userId, date)
  if (!row) {
    res.status(409).json({ error: 'no pick for this date yet' })
    return
  }
  if (row.completed_at !== null) {
    res.status(409).json({ error: 'already completed today' })
    return
  }
  await db.execute({
    sql: 'INSERT INTO revisions (item_id, revised_at) VALUES (?, ?)',
    args: [row.item_id, now()],
  })
  await db.execute({
    sql: 'UPDATE daily_picks SET completed_at = ? WHERE id = ?',
    args: [now(), row.id],
  })
  res.json(await pickResponse((await getPickRow(userId, date))!))
})

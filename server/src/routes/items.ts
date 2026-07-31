import { Router } from 'express'
import { db, now } from '../db.js'

export const itemsRouter = Router()

const itemColumns = `
  i.id, i.title, i.notes, i.created_at AS createdAt, i.archived_at AS archivedAt,
  MAX(r.revised_at) AS lastRevisedAt,
  COUNT(r.id) AS revisionCount
`

itemsRouter.get('/', async (req, res) => {
  const userId = req.user!.id
  const archived = req.query.archived === '1'
  const result = await db.execute({
    sql: `SELECT ${itemColumns}
          FROM items i LEFT JOIN revisions r ON r.item_id = i.id
          WHERE i.user_id = ? AND i.archived_at IS ${archived ? 'NOT NULL' : 'NULL'}
          GROUP BY i.id
          ORDER BY i.created_at DESC`,
    args: [userId],
  })
  res.json({ items: result.rows })
})

itemsRouter.post('/', async (req, res) => {
  const userId = req.user!.id
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  if (title.length > 200 || notes.length > 1000) {
    res.status(400).json({ error: 'title is limited to 200 characters, notes to 1000' })
    return
  }
  const inserted = await db.execute({
    sql: 'INSERT INTO items (user_id, title, notes, created_at) VALUES (?, ?, ?, ?)',
    args: [userId, title, notes, now()],
  })
  const result = await db.execute({
    sql: `SELECT ${itemColumns}
          FROM items i LEFT JOIN revisions r ON r.item_id = i.id
          WHERE i.id = ? GROUP BY i.id`,
    args: [Number(inserted.lastInsertRowid)],
  })
  res.status(201).json({ item: result.rows[0] })
})

itemsRouter.put('/:id', async (req, res) => {
  const userId = req.user!.id
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  if (title.length > 200 || notes.length > 1000) {
    res.status(400).json({ error: 'title is limited to 200 characters, notes to 1000' })
    return
  }
  const result = await db.execute({
    sql: 'UPDATE items SET title = ?, notes = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    args: [title, notes, req.params.id, userId],
  })
  if (result.rowsAffected === 0) {
    res.status(404).json({ error: 'item not found' })
    return
  }
  res.json({ ok: true })
})

// User-facing delete: the item leaves the list and the rotation for
// good, but completed daily_picks stay so streaks and the heatmap keep
// the days the user earned. Implemented as a hidden archive so those
// rows keep a valid item to reference; only today's *unfinished* pick
// is removed, letting a fresh pick roll.
itemsRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.id
  const owned = await db.execute({
    sql: 'SELECT id FROM items WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    args: [req.params.id, userId],
  })
  if (owned.rows.length === 0) {
    res.status(404).json({ error: 'item not found' })
    return
  }
  const itemId = (owned.rows[0] as unknown as { id: number }).id
  // batch = one atomic transaction: all of these succeed or none do
  await db.batch(
    [
      { sql: 'UPDATE items SET archived_at = ? WHERE id = ?', args: [now(), itemId] },
      { sql: 'DELETE FROM daily_picks WHERE item_id = ? AND completed_at IS NULL', args: [itemId] },
    ],
    'write',
  )
  res.json({ ok: true })
})

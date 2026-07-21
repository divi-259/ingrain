import { Router } from 'express'
import { db, now } from '../db.js'

export const itemsRouter = Router()

// TODO(auth): replace with req.user.id once login exists (M6)
const userId = 1

const itemColumns = `
  i.id, i.title, i.notes, i.created_at AS createdAt, i.archived_at AS archivedAt,
  MAX(r.revised_at) AS lastRevisedAt,
  COUNT(r.id) AS revisionCount
`

itemsRouter.get('/', async (req, res) => {
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
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'title is required' })
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
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const result = await db.execute({
    sql: 'UPDATE items SET title = ?, notes = ? WHERE id = ? AND user_id = ?',
    args: [title, notes, req.params.id, userId],
  })
  if (result.rowsAffected === 0) {
    res.status(404).json({ error: 'item not found' })
    return
  }
  res.json({ ok: true })
})

// "Delete" is an archive: history stays intact, item leaves the rotation.
itemsRouter.delete('/:id', async (req, res) => {
  const result = await db.execute({
    sql: 'UPDATE items SET archived_at = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    args: [now(), req.params.id, userId],
  })
  if (result.rowsAffected === 0) {
    res.status(404).json({ error: 'item not found' })
    return
  }
  res.json({ ok: true })
})

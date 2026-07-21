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

itemsRouter.get('/', (req, res) => {
  const archived = req.query.archived === '1'
  const items = db
    .prepare(
      `SELECT ${itemColumns}
       FROM items i LEFT JOIN revisions r ON r.item_id = i.id
       WHERE i.user_id = ? AND i.archived_at IS ${archived ? 'NOT NULL' : 'NULL'}
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
    )
    .all(userId)
  res.json({ items })
})

itemsRouter.post('/', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }
  const result = db
    .prepare('INSERT INTO items (user_id, title, notes, created_at) VALUES (?, ?, ?, ?)')
    .run(userId, title, notes, now())
  const item = db
    .prepare(
      `SELECT ${itemColumns}
       FROM items i LEFT JOIN revisions r ON r.item_id = i.id
       WHERE i.id = ? GROUP BY i.id`,
    )
    .get(result.lastInsertRowid)
  res.status(201).json({ item })
})

itemsRouter.put('/:id', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : ''
  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }
  const result = db
    .prepare('UPDATE items SET title = ?, notes = ? WHERE id = ? AND user_id = ?')
    .run(title, notes, req.params.id, userId)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'item not found' })
  }
  res.json({ ok: true })
})

// "Delete" is an archive: history stays intact, item leaves the rotation.
itemsRouter.delete('/:id', (req, res) => {
  const result = db
    .prepare('UPDATE items SET archived_at = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL')
    .run(now(), req.params.id, userId)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'item not found' })
  }
  res.json({ ok: true })
})

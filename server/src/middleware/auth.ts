import type { Request, Response, NextFunction } from 'express'
import { db, now } from '../db.js'

// Make req.user a known property on every Express request
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.ingrain_session
  if (!token) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  const result = await db.execute({
    sql: `SELECT u.id, u.email
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?`,
    args: [token, now()],
  })
  const row = result.rows[0] as unknown as { id: number; email: string } | undefined
  if (!row) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  req.user = { id: row.id, email: row.email }
  next()
}

import { Router } from 'express'
import { randomInt, randomBytes } from 'node:crypto'
import { db, now } from '../db.js'
import { sendLoginEmail } from '../lib/email.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

const CODE_TTL_MS = 10 * 60 * 1000 // codes live 10 minutes
const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000 // sessions live 180 days
const MAX_ATTEMPTS = 5
const COOKIE_NAME = 'ingrain_session'

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

interface CodeRow {
  id: number
  user_id: number
  code: string
  expires_at: string
  consumed_at: string | null
  attempts: number
}

authRouter.post('/request-code', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!email.includes('@')) {
    res.status(400).json({ error: 'valid email is required' })
    return
  }

  // Signup and login are the same flow: create the user if new.
  await db.execute({
    sql: 'INSERT INTO users (email, created_at) VALUES (?, ?) ON CONFLICT(email) DO NOTHING',
    args: [email, now()],
  })
  const userResult = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email],
  })
  const userId = (userResult.rows[0] as unknown as { id: number }).id

  // Only the newest code should work — burn any outstanding ones.
  await db.execute({
    sql: 'UPDATE login_codes SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL',
    args: [now(), userId],
  })

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const magicToken = randomBytes(32).toString('hex')
  await db.execute({
    sql: `INSERT INTO login_codes (user_id, code, magic_token, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [userId, code, magicToken, new Date(Date.now() + CODE_TTL_MS).toISOString(), now()],
  })

  await sendLoginEmail(email, code, `${CLIENT_URL}/auth/verify?token=${magicToken}`)

  // Same response whether the email was new or known — never leak
  // which addresses have accounts.
  res.json({ ok: true })
})

authRouter.post('/verify', async (req, res) => {
  const { email, code, token } = req.body as { email?: string; code?: string; token?: string }

  let row: CodeRow | undefined
  if (typeof token === 'string' && token.length > 0) {
    const result = await db.execute({
      sql: 'SELECT * FROM login_codes WHERE magic_token = ?',
      args: [token],
    })
    row = result.rows[0] as unknown as CodeRow | undefined
  } else if (typeof email === 'string' && typeof code === 'string') {
    const result = await db.execute({
      sql: `SELECT lc.* FROM login_codes lc
            JOIN users u ON u.id = lc.user_id
            WHERE u.email = ? AND lc.consumed_at IS NULL
            ORDER BY lc.id DESC LIMIT 1`,
      args: [email.trim().toLowerCase()],
    })
    row = result.rows[0] as unknown as CodeRow | undefined
    if (row && row.code !== code.trim()) {
      // Wrong code: count the attempt, then fail the same way as any
      // other rejection.
      await db.execute({
        sql: 'UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?',
        args: [row.id],
      })
      row = undefined
    }
  }

  if (!row || row.consumed_at !== null || row.expires_at < now() || row.attempts >= MAX_ATTEMPTS) {
    res.status(401).json({ error: 'invalid or expired code' })
    return
  }

  // Single-use: consume the code, then open a long-lived session.
  await db.execute({
    sql: 'UPDATE login_codes SET consumed_at = ? WHERE id = ?',
    args: [now(), row.id],
  })
  const sessionToken = randomBytes(32).toString('hex')
  await db.execute({
    sql: 'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    args: [sessionToken, row.user_id, now(), new Date(Date.now() + SESSION_TTL_MS).toISOString()],
  })

  // Lazy cleanup: dead sessions get swept whenever someone logs in.
  await db.execute({ sql: 'DELETE FROM sessions WHERE expires_at < ?', args: [now()] })

  res.cookie(COOKIE_NAME, sessionToken, {
    httpOnly: true, // JS can never read it — XSS can't steal the session
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
    secure: process.env.NODE_ENV === 'production', // HTTPS-only when deployed
  })

  const userResult = await db.execute({
    sql: 'SELECT id, email FROM users WHERE id = ?',
    args: [row.user_id],
  })
  res.json({ user: userResult.rows[0] })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

authRouter.post('/logout', requireAuth, async (req, res) => {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [req.cookies.ingrain_session],
  })
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

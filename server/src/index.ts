import './env.js'
import express from 'express'
import cookieParser from 'cookie-parser'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { itemsRouter } from './routes/items.js'
import { todayRouter } from './routes/today.js'
import { requireAuth } from './middleware/auth.js'

const isProd = process.env.NODE_ENV === 'production'

const app = express()

// Render terminates HTTPS at its proxy; trust it so Express knows
// requests are secure (needed for secure cookies to behave).
if (isProd) app.set('trust proxy', 1)

// Parse JSON request bodies into req.body for every route
app.use(express.json())
// Parse the Cookie header into req.cookies
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
// Everything below requires a valid session cookie
app.use('/api/items', requireAuth, itemsRouter)
app.use('/api/today', requireAuth, todayRouter)

// In production there is no Vite dev server: Express serves the built
// client. Any GET that isn't /api/* falls back to index.html so
// client-side routes like /items and /auth/verify work on refresh.
if (isProd) {
  const clientDist = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist')
  app.use(express.static(clientDist))
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

// Any error thrown in a route lands here instead of crashing the server
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal server error' })
})

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`Ingrain server listening on http://localhost:${PORT}`)
})

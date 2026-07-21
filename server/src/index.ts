import express from 'express'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.js'
import { itemsRouter } from './routes/items.js'
import { todayRouter } from './routes/today.js'
import { requireAuth } from './middleware/auth.js'

const app = express()

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

// Any error thrown in a route lands here instead of crashing the server
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal server error' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Ingrain server listening on http://localhost:${PORT}`)
})

import express from 'express'
import { itemsRouter } from './routes/items.js'

const app = express()

// Parse JSON request bodies into req.body for every route
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/items', itemsRouter)

// Any error thrown in a route lands here instead of crashing the server
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal server error' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Ingrain server listening on http://localhost:${PORT}`)
})

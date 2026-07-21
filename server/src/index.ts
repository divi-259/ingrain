import express from 'express'

const app = express()

// Parse JSON request bodies into req.body for every route
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Ingrain server listening on http://localhost:${PORT}`)
})

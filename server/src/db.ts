import { createClient } from '@libsql/client'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const dataDir = join(here, '..', 'data')
mkdirSync(dataDir, { recursive: true })

// Dev: a plain local file, just like SQLite. Prod: point these env
// vars at Turso and the same code talks to the hosted database.
const url = process.env.TURSO_DATABASE_URL ?? `file:${join(dataDir, 'ingrain.db')}`

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

if (url.startsWith('file:')) {
  await db.execute('PRAGMA journal_mode = WAL')
  await db.execute('PRAGMA foreign_keys = ON')
}

// Apply the schema on every startup — safe because every statement
// is CREATE ... IF NOT EXISTS.
await db.executeMultiple(readFileSync(join(here, 'schema.sql'), 'utf8'))

// TODO(auth): remove once real login exists (M6). Until then all
// routes act as this seeded dev user.
await db.execute({
  sql: `INSERT INTO users (id, email, created_at) VALUES (1, 'dev@local', ?)
        ON CONFLICT(id) DO NOTHING`,
  args: [new Date().toISOString()],
})

export function now(): string {
  return new Date().toISOString()
}

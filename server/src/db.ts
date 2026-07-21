import Database from 'better-sqlite3'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const dataDir = join(here, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new Database(join(dataDir, 'ingrain.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Apply the schema on every startup — safe because every statement
// is CREATE ... IF NOT EXISTS.
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'))

// TODO(auth): remove once real login exists (M6). Until then all
// routes act as this seeded dev user.
db.prepare(
  `INSERT INTO users (id, email, created_at) VALUES (1, 'dev@local', ?)
   ON CONFLICT(id) DO NOTHING`,
).run(new Date().toISOString())

export function now(): string {
  return new Date().toISOString()
}

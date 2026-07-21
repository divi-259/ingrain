import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load server/.env if it exists. This module must be imported before
// any module that reads process.env at import time (db.ts, email.ts).
try {
  process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env'))
} catch {
  // no .env file — fine, dev works without one
}

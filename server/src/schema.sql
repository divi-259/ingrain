CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,        -- stored lowercased
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_codes (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  code         TEXT NOT NULL,              -- 6 digits
  magic_token  TEXT NOT NULL UNIQUE,       -- 64-char hex
  expires_at   TEXT NOT NULL,              -- created_at + 10 min
  consumed_at  TEXT,                       -- NULL = still usable
  attempts     INTEGER NOT NULL DEFAULT 0, -- wrong-code attempts, max 5
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,            -- 64-char hex random, the cookie value
  user_id     INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL                -- created_at + 180 days
);

CREATE TABLE IF NOT EXISTS items (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  title        TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  link         TEXT NOT NULL DEFAULT '',   -- optional resource URL (see migrations in db.ts)
  created_at   TEXT NOT NULL,
  archived_at  TEXT                        -- soft delete; NULL = active
);

CREATE TABLE IF NOT EXISTS revisions (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  revised_at  TEXT NOT NULL,               -- full timestamp, one row per completion
  note        TEXT NOT NULL DEFAULT ''     -- optional "what I remembered" (see migrations in db.ts)
);

CREATE TABLE IF NOT EXISTS daily_picks (
  id               INTEGER PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  date             TEXT NOT NULL,          -- 'YYYY-MM-DD', user-local
  item_id          INTEGER NOT NULL REFERENCES items(id),
  skipped_item_id  INTEGER REFERENCES items(id),  -- NULL until the one skip is used
  completed_at     TEXT,                   -- NULL until marked done
  created_at       TEXT NOT NULL,
  UNIQUE (user_id, date)                   -- the lock: one pick per user per day
);

CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_revisions_item ON revisions(item_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

# Ingrain — Architecture

A plain-language tour of how this project fits together. If you read this top to bottom, you should be able to predict what any file does before opening it.

## The big picture

Ingrain is two programs that talk to each other:

```
your browser
    │  (clicks, forms)
    ▼
┌──────────────────┐      /api/* requests      ┌──────────────────┐
│  client/         │ ────────────────────────► │  server/         │
│  React app       │ ◄──────────────────────── │  Express API     │
│  (what you see)  │        JSON back          │  (rules + data)  │
└──────────────────┘                           └────────┬─────────┘
                                                        │ SQL
                                                        ▼
                                               ┌──────────────────┐
                                               │  database        │
                                               │  dev:  local file│
                                               │  prod: Turso     │
                                               └──────────────────┘
```

- The **client** is everything you see: pages, buttons, forms. It holds no real data — it always asks the server.
- The **server** owns all the rules: who you are, what your items are, what today's pick is. It's the only thing allowed to touch the database.
- The **database** is where truth lives. If the browser and the database ever disagree, the database wins — that's why the app refetches from the server after every change.

The root folder is just glue: one `package.json` whose `dev` script starts both programs at once, and this documentation.

## Dev vs production — same code, two shapes

**In development** (`npm run dev`): two processes run. Vite serves the React app at `localhost:5173` with instant hot reload, and Express runs at `localhost:3001`. The magic is in `client/vite.config.ts`: any request starting with `/api` is silently forwarded from 5173 to 3001. The browser believes there is only one website. That makes cookies and security simple — no cross-origin anything.

**In production** (Render): there is no Vite. `npm run build` compiles the React app into plain static files (`client/dist`), and Express serves those files itself alongside the API — one process, one URL. Same-origin again, by construction. The database also swaps: instead of the local file, the server talks to Turso (hosted libSQL) because Render wipes its local disk on every deploy.

The switch is entirely driven by environment variables (`NODE_ENV`, `TURSO_DATABASE_URL`, etc.) — the code is identical in both worlds.

## The server, file by file (`server/src/`)

- **`index.ts`** — the front door. Builds the Express app, plugs in middleware (JSON parsing, cookie parsing), mounts the three routers under their URL prefixes, serves the built client in production, and catches any error so the process never crashes. Order matters here: requests flow top to bottom through this file.
- **`env.ts`** — loads `server/.env` into `process.env`. It must be the *first* import in `index.ts`, because other files read env vars the moment they're imported.
- **`db.ts`** — opens the database (local file, or Turso if the env vars are set) and applies `schema.sql` on every startup. Safe to re-run because every statement is `CREATE TABLE IF NOT EXISTS`.
- **`schema.sql`** — the entire data model in one readable file. See "The database" below.
- **`middleware/auth.ts`** — the bouncer. `requireAuth` runs before every protected route: it reads the session cookie, looks it up in the `sessions` table, and either attaches `req.user = { id, email }` or replies 401. Routes never check cookies themselves — they just trust `req.user`.
- **`routes/auth.ts`** — login lifecycle: `request-code` (make a 6-digit code + magic link and email them), `verify` (exchange code *or* link token for a session cookie), `me` (who am I?), `logout` (delete the session).
- **`routes/items.ts`** — CRUD for your list. "Delete" is really *archive* (sets `archived_at`) so revision history is never destroyed. Every query includes `WHERE user_id = ?` — ownership is enforced in SQL, not in JS.
- **`routes/today.ts`** — the daily engine: get today's pick (creating and locking it on first request), spend your one skip, mark done (which appends to `revisions`).
- **`lib/pick.ts`** — the weighted-random algorithm as a pure function: no database, no HTTP, just "given these items and today's date, choose one." Items neglected longer get proportionally higher odds; never-revised items get a head start.
- **`lib/email.ts`** — sends the login email through Resend when `RESEND_API_KEY` is set. Outside production it *also* prints the code and link to the console, so local dev never depends on real email.

## The client, file by file (`client/src/`)

- **`main.tsx`** — boots React into the single `<div id="root">` in `index.html`.
- **`App.tsx`** — the auth gate and router. On load it asks `GET /api/auth/me`. Logged out → login routes. Logged in → the nav plus the two app pages. This one component decides which world you see.
- **`api.ts`** — the client's only way to talk to the server: a small typed `fetch` wrapper (JSON headers, throws the server's error message), plus date helpers — `localDate()` (your calendar date, which defines "today") and `daysAgoLabel()` ("3 days ago").
- **`pages/TodayPage.tsx`** — the heart of the app: shows today's pick with Done and Skip buttons. It renders whatever state the server reports: pending, completed, skip-spent, or "no items yet."
- **`pages/ItemsPage.tsx`** — your list: add form, inline editing, archive. After every change it refetches the list rather than guessing.
- **`pages/LoginPage.tsx`** — two steps in one component: enter email → enter the 6-digit code.
- **`pages/VerifyPage.tsx`** — where the magic link lands. Reads `?token=` from the URL and posts it to the server; on success you're signed in.
- **`styles.css`** — the one stylesheet. Plain CSS, no framework.

## The database (6 tables)

```
users ──┬── items ──┬── revisions        (one row per completed revision — append-only)
        │           └── daily_picks      (one row per user per day — the lock)
        ├── sessions                     (one row per logged-in device)
        └── login_codes                  (short-lived login attempts)
```

- **`users`** — one row per email address. Signup and login are the same thing.
- **`login_codes`** — each login attempt: the 6-digit code, the magic-link token, a 10-minute expiry, an attempt counter (max 5 wrong guesses), and `consumed_at` so each is single-use.
- **`sessions`** — the long-lived logins. The random token here is exactly what's in your browser's cookie; the row existing *is* being logged in, which is why logout = deleting the row, and why sessions survive server restarts.
- **`items`** — your list. `archived_at` is the soft-delete flag.
- **`revisions`** — one row every time you press Done. Never updated, never deleted. "Last revised" and "revised N times" are *computed* from this table with a JOIN, never stored — so they can't go stale.
- **`daily_picks`** — one row per user per date. The `UNIQUE(user_id, date)` constraint is the daily lock: the database itself makes a second pick for the same day impossible. `skipped_item_id` doubles as the "skip already used" flag; `completed_at` marks the day done.

## Two journeys through the whole stack

**Clicking the magic link:** email link → Express serves the React shell (it ignores the token) → React routes to `VerifyPage` → it POSTs the token to `/api/auth/verify` → server checks the `login_codes` row (unused? not expired?), marks it consumed, inserts a `sessions` row, and sets the `ingrain_session` cookie (httpOnly, 180 days) → the browser attaches that cookie to every future request → `requireAuth` turns it back into `req.user` each time. The token dies in seconds; the session is what keeps you in.

**Opening the Today page:** `TodayPage` asks `GET /api/today?date=2026-07-30` (the date comes from *your* clock — that's what "today" means). The server checks `daily_picks` for that user+date. Row exists → return it, locked. No row → load active items with their last-revised dates, run `pick.ts`, insert the row, return it. Press **Done** → a `revisions` row is appended and `completed_at` set; press **Skip** → the pick is re-rolled once, excluding the current item, and the old one is remembered in `skipped_item_id`. Refresh the page and nothing changes — the state was never in the browser.

## Where secrets live

Nothing secret is in git. `server/.env` (gitignored, template in `.env.example`) holds local values; Render's Environment tab holds production values:

| Variable | Purpose |
|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | hosted database (unset locally → local file) |
| `RESEND_API_KEY` | real login emails (unset locally → console fallback) |
| `CLIENT_URL` | where magic links point (defaults to `localhost:5173`) |
| `NODE_ENV=production` | serve built client, secure cookies, no console codes |

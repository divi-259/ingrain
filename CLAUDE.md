# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Ingrain — a personal spaced-revision web app. The user keeps a list of small (15–20 min) learning items; every day the app picks one via weighted random (longer-neglected items are likelier), locked for the day with one skip allowed. Passwordless email login (6-digit code + magic link).

## Commands

- `npm run dev` (at root) — starts both dev servers via concurrently: Express on :3001, Vite on :5173. Open http://localhost:5173.
- Type-check: `npx tsc --noEmit` in `server/`, `npx tsc -b` in `client/`.
- Inspect the dev database: `sqlite3 server/data/ingrain.db`.
- No test framework yet; verification is curl against `localhost:5173/api/...` plus browser checks.

## Architecture

Two self-contained packages (no npm workspaces): `server/` (Express 5 + TypeScript, run with tsx) and `client/` (Vite + React 19 + react-router). The Vite dev proxy forwards `/api` to :3001, so the browser is always same-origin — no CORS, cookies just work.

- **Database**: libSQL via `@libsql/client` — local file `server/data/ingrain.db` in dev, Turso in prod via `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`. All DB calls are `await db.execute({ sql, args })`. Schema in `server/src/schema.sql`, applied idempotently on startup; for dev schema changes, delete the db file and restart. Do NOT reintroduce sync drivers (better-sqlite3 was deliberately removed for Turso compatibility).
- **Auth**: `login_codes` (single-use, 10-min expiry, 5 attempts) → `sessions` (180-day httpOnly cookie `ingrain_session`). `requireAuth` middleware attaches `req.user`; items/today routers assume it. Magic links point at the client route `/auth/verify?token=…`.
- **Daily pick**: `server/src/lib/pick.ts` (pure function; weight = days since last revision + 1, never-revised = days since created + 3). The lock is the `UNIQUE(user_id, date)` constraint on `daily_picks`; "skip used" = `skipped_item_id IS NOT NULL`. "Today" is the client's local date, sent as `?date=YYYY-MM-DD`.
- **History**: `revisions` is append-only; `lastRevisedAt`/`revisionCount` are always computed via LEFT JOIN, never stored.
- **Email**: `server/src/lib/email.ts` — Resend when `RESEND_API_KEY` is set (best-effort), always console-logs the code/link outside production. Env vars load from `server/.env` (see `.env.example`) via `src/env.ts`, which must stay the first import in `index.ts`.

## Conventions

- Items are soft-deleted (`archived_at`), never hard-deleted — history must survive.
- Ownership checks live in SQL (`WHERE user_id = ?`), not in JS.
- Commit messages: short single-line, e.g. "Add Items Page UI".

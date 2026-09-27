// The app's entire "backend": everything lives in one localStorage key.
// Every function below mirrors what used to be an Express route —
// same behavior, same response shapes, just synchronous and local.
import { pickWeighted, weightFor, type Candidate } from './pick'
import { computeStreak, type Streak } from './streak'

export type { Streak }

const STORAGE_KEY = 'ingrain-data'

interface StoredItem {
  id: string
  title: string
  notes: string
  link: string
  createdAt: string
  archivedAt: string | null
}

interface StoredRevision {
  id: string
  itemId: string
  revisedAt: string
  note: string
}

interface StoredPick {
  id: string
  date: string
  itemId: string
  skippedItemId: string | null
  completedAt: string | null
  createdAt: string
}

interface StoreData {
  version: 1
  items: StoredItem[]
  revisions: StoredRevision[]
  dailyPicks: StoredPick[]
}

// Shape of an item as every page consumes it — the stored fields plus
// the two values that used to be computed with a SQL JOIN.
export interface Item {
  id: string
  title: string
  notes: string
  link: string
  createdAt: string
  archivedAt: string | null
  lastRevisedAt: string | null
  revisionCount: number
}

export interface Pick {
  date: string
  item: Item
  lastNote: { note: string; revisedAt: string } | null
  why: { multiplier: number; neverRevised: boolean; candidates: number } | null
  skipAvailable: boolean
  completed: boolean
}

export interface TodayResponse {
  pick: Pick | null
  streak: Streak
}

export interface History {
  completedDates: string[]
  streak: Streak
  totals: { daysCompleted: number; revisions: number; activeItems: number }
}

function now(): string {
  return new Date().toISOString()
}

function emptyStore(): StoreData {
  return { version: 1, items: [], revisions: [], dailyPicks: [] }
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.items) ||
      !Array.isArray(parsed.revisions) ||
      !Array.isArray(parsed.dailyPicks)
    ) {
      return emptyStore()
    }
    return { version: 1, items: parsed.items, revisions: parsed.revisions, dailyPicks: parsed.dailyPicks }
  } catch {
    return emptyStore()
  }
}

function save(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Trim, cap, and force an http(s) scheme — prefixing anything schemeless
// also neutralizes javascript: and friends.
function cleanLink(raw: unknown): string {
  let link = typeof raw === 'string' ? raw.trim().slice(0, 2000) : ''
  if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`
  return link
}

function lastRevisedAtFor(data: StoreData, itemId: string): string | null {
  let latest: string | null = null
  for (const r of data.revisions) {
    if (r.itemId === itemId && (latest === null || r.revisedAt > latest)) latest = r.revisedAt
  }
  return latest
}

function revisionCountFor(data: StoreData, itemId: string): number {
  return data.revisions.filter((r) => r.itemId === itemId).length
}

function toItemView(data: StoreData, item: StoredItem): Item {
  return {
    ...item,
    lastRevisedAt: lastRevisedAtFor(data, item.id),
    revisionCount: revisionCountFor(data, item.id),
  }
}

function activeCandidates(data: StoreData, excludeItemId?: string): Candidate[] {
  return data.items
    .filter((i) => i.archivedAt === null && i.id !== excludeItemId)
    .map((i) => ({ id: i.id, createdAt: i.createdAt, lastRevisedAt: lastRevisedAtFor(data, i.id) }))
}

function getPickRow(data: StoreData, date: string): StoredPick | undefined {
  return data.dailyPicks.find((p) => p.date === date)
}

function streakFor(data: StoreData, date: string): Streak {
  const dates = data.dailyPicks.filter((p) => p.completedAt !== null).map((p) => p.date)
  return computeStreak(dates, date)
}

// How the picked item's odds compared to the field, so the UI can say
// "2.6× the average odds today" instead of the pick feeling random.
function whyPicked(data: StoreData, itemId: string, date: string) {
  const candidates = activeCandidates(data)
  const picked = candidates.find((c) => c.id === itemId)
  if (!picked) return null
  const weights = candidates.map((c) => weightFor(c, date))
  const avg = weights.reduce((a, b) => a + b, 0) / candidates.length
  return {
    multiplier: Math.round((weightFor(picked, date) / avg) * 10) / 10,
    neverRevised: picked.lastRevisedAt === null,
    candidates: candidates.length,
  }
}

// The most recent thing you wrote about this item — shown before you
// revise, so your past self can prime your current self.
function lastNoteFor(data: StoreData, itemId: string): { note: string; revisedAt: string } | null {
  const notes = data.revisions
    .filter((r) => r.itemId === itemId && r.note !== '')
    .sort((a, b) => (a.revisedAt < b.revisedAt ? 1 : -1))
  return notes[0] ? { note: notes[0].note, revisedAt: notes[0].revisedAt } : null
}

function pickResponse(data: StoreData, row: StoredPick): TodayResponse {
  // Items are never hard-deleted, so this lookup always succeeds even
  // if the item was archived after today's pick was made.
  const item = data.items.find((i) => i.id === row.itemId)!
  return {
    pick: {
      date: row.date,
      item: toItemView(data, item),
      lastNote: lastNoteFor(data, row.itemId),
      why: whyPicked(data, row.itemId, row.date),
      skipAvailable: row.skippedItemId === null,
      completed: row.completedAt !== null,
    },
    streak: streakFor(data, row.date),
  }
}

// ---- items ----

export function listItems(archived = false): Item[] {
  const data = load()
  return data.items
    .filter((i) => (archived ? i.archivedAt !== null : i.archivedAt === null))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((i) => toItemView(data, i))
}

export function createItem(input: { title: string; notes?: string; link?: string }): Item {
  const title = input.title.trim()
  const notes = (input.notes ?? '').trim()
  if (!title) throw new Error('title is required')
  if (title.length > 200 || notes.length > 1000) {
    throw new Error('title is limited to 200 characters, notes to 1000')
  }
  const data = load()
  const item: StoredItem = {
    id: crypto.randomUUID(),
    title,
    notes,
    link: cleanLink(input.link),
    createdAt: now(),
    archivedAt: null,
  }
  data.items.push(item)
  save(data)
  return toItemView(data, item)
}

export function updateItem(id: string, input: { title: string; notes?: string; link?: string }): Item {
  const title = input.title.trim()
  const notes = (input.notes ?? '').trim()
  if (!title) throw new Error('title is required')
  if (title.length > 200 || notes.length > 1000) {
    throw new Error('title is limited to 200 characters, notes to 1000')
  }
  const data = load()
  const item = data.items.find((i) => i.id === id && i.archivedAt === null)
  if (!item) throw new Error('item not found')
  item.title = title
  item.notes = notes
  item.link = cleanLink(input.link)
  save(data)
  return toItemView(data, item)
}

// Archives the item (so completed picks/revisions keep a valid item to
// reference and your streak/heatmap stay intact) and drops only today's
// *uncompleted* pick, letting a fresh pick roll for anyone still deciding.
export function deleteItem(id: string): void {
  const data = load()
  const item = data.items.find((i) => i.id === id && i.archivedAt === null)
  if (!item) throw new Error('item not found')
  item.archivedAt = now()
  data.dailyPicks = data.dailyPicks.filter((p) => !(p.itemId === id && p.completedAt === null))
  save(data)
}

// ---- today ----

export function getToday(date: string): TodayResponse {
  const data = load()
  let row = getPickRow(data, date)
  if (!row) {
    const chosen = pickWeighted(activeCandidates(data), date)
    if (!chosen) return { pick: null, streak: streakFor(data, date) }
    row = {
      id: crypto.randomUUID(),
      date,
      itemId: chosen.id,
      skippedItemId: null,
      completedAt: null,
      createdAt: now(),
    }
    data.dailyPicks.push(row)
    save(data)
  }
  return pickResponse(data, row)
}

export function skipToday(date: string): TodayResponse {
  const data = load()
  const row = getPickRow(data, date)
  if (!row) throw new Error('no pick for this date yet')
  if (row.completedAt !== null) throw new Error('already completed today')
  if (row.skippedItemId !== null) throw new Error('skip already used today')
  const chosen = pickWeighted(activeCandidates(data, row.itemId), date)
  if (!chosen) throw new Error('no other items to swap to')
  row.skippedItemId = row.itemId
  row.itemId = chosen.id
  save(data)
  return pickResponse(data, row)
}

export function completeToday(date: string, note: string): TodayResponse {
  const data = load()
  const row = getPickRow(data, date)
  if (!row) throw new Error('no pick for this date yet')
  if (row.completedAt !== null) throw new Error('already completed today')
  const cleanNote = (note ?? '').trim().slice(0, 500)
  data.revisions.push({ id: crypto.randomUUID(), itemId: row.itemId, revisedAt: now(), note: cleanNote })
  row.completedAt = now()
  save(data)
  return pickResponse(data, row)
}

// ---- history ----

export function getHistory(date: string): History {
  const data = load()
  const completedDates = data.dailyPicks
    .filter((p) => p.completedAt !== null)
    .map((p) => p.date)
    .sort()
  return {
    completedDates,
    streak: computeStreak(completedDates, date),
    totals: {
      daysCompleted: completedDates.filter((d) => d <= date).length,
      revisions: data.revisions.length,
      activeItems: data.items.filter((i) => i.archivedAt === null).length,
    },
  }
}

// ---- backup ----

export function exportData(): string {
  return JSON.stringify(load(), null, 2)
}

export function importData(json: string): void {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('that file is not valid JSON')
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as StoreData).items) ||
    !Array.isArray((parsed as StoreData).revisions) ||
    !Array.isArray((parsed as StoreData).dailyPicks)
  ) {
    throw new Error("that doesn't look like an Ingrain backup")
  }
  const p = parsed as StoreData
  save({ version: 1, items: p.items, revisions: p.revisions, dailyPicks: p.dailyPicks })
}

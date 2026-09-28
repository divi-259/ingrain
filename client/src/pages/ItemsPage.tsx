import { useEffect, useRef, useState } from 'react'
import { daysAgoLabel, linkLabel } from '../lib/format'
import { createItem, deleteItem, exportData, importData, listItems, updateItem, type Item } from '../lib/store'
import Mascot from '../components/Mascot'
import PageBackdrop from '../components/PageBackdrop'

// A single glyph, mirrored for import — avoids drawing two icons for what's
// visually the same shape pointed the other way.
function DataIcon({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg
      className="backup-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={direction === 'up' ? { transform: 'rotate(180deg)' } : undefined}
      aria-hidden="true"
    >
      <path d="M12 4v11m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')

  // add form
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newLink, setNewLink] = useState('')

  // inline edit: id of the row being edited, plus its draft values
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLink, setEditLink] = useState('')

  // id of the row currently showing the inline delete confirmation
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const importInputRef = useRef<HTMLInputElement | null>(null)

  function refresh() {
    setItems(listItems())
  }

  useEffect(() => {
    refresh()
  }, [])

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      createItem({ title: newTitle, notes: newNotes, link: newLink })
      setNewTitle('')
      setNewNotes('')
      setNewLink('')
      setError('')
      refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function startEdit(item: Item) {
    setConfirmingId(null)
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditNotes(item.notes)
    setEditLink(item.link)
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    try {
      updateItem(editingId!, { title: editTitle, notes: editNotes, link: editLink })
      setEditingId(null)
      setError('')
      refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function removeItem(item: Item) {
    try {
      deleteItem(item.id)
      setConfirmingId(null)
      setError('')
      refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ingrain-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file next time
    if (!file) return
    try {
      const text = await file.text()
      importData(text)
      setError('')
      refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <PageBackdrop />
      <main className="items-main">
        <h1>My items</h1>
        <p className="page-subtitle">Things you're learning, revisiting, and making part of your journey.</p>

        <div className="add-card">
          <div className="add-card-heading">
            <h2>Add to your journey</h2>
            <Mascot expression="motivated" size={40} />
          </div>
          <form onSubmit={addItem} className="add-form">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Something to learn or revise (15–20 min)"
              aria-label="Title"
              maxLength={200}
            />
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              aria-label="Notes"
              maxLength={1000}
            />
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Link (optional)"
              aria-label="Link"
              maxLength={2000}
            />
            <button type="submit" className="primary" disabled={!newTitle.trim()}>Add</button>
          </form>
        </div>

        <div className="backup-row">
          <div className="backup-buttons">
            <button type="button" className="secondary" onClick={handleExport}>
              <DataIcon direction="down" /> Export data
            </button>
            <button type="button" className="secondary" onClick={handleImportClick}>
              <DataIcon direction="up" /> Import data
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>
          <p className="backup-note">Your data lives only in this browser — export a backup now and then.</p>
        </div>

        {error && <p className="error">{error}</p>}
        {items.length === 0 && (
          <div className="empty-state">
            <Mascot expression="calm" size={72} />
            <h2>Your trail is waiting.</h2>
            <p>Add something you want to learn or revisit.</p>
          </div>
        )}

        <ul className="item-list">
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="item-row">
                <Mascot expression="thinking" size={32} />
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    aria-label="Edit title"
                    maxLength={200}
                  />
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    aria-label="Edit notes"
                    maxLength={1000}
                  />
                  <input
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="Link (optional)"
                    aria-label="Edit link"
                    maxLength={2000}
                  />
                  <button type="submit" className="primary" disabled={!editTitle.trim()}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              </li>
            ) : (
              <li key={item.id} className="item-row">
                <div className="item-main">
                  <span className="item-title">{item.title}</span>
                  {item.notes && <span className="item-notes">{item.notes}</span>}
                  {item.link && (
                    <a className="item-link" href={item.link} target="_blank" rel="noreferrer">
                      {linkLabel(item.link)} ↗
                    </a>
                  )}
                  <span className="muted">
                    last revised {daysAgoLabel(item.lastRevisedAt)}
                    {item.revisionCount > 0 && ` · ${item.revisionCount}×`}
                  </span>
                </div>
                {confirmingId !== item.id && (
                  <div className="item-actions">
                    <button type="button" className="secondary" onClick={() => startEdit(item)}>Edit</button>
                    <button type="button" className="delete-hint" onClick={() => setConfirmingId(item.id)}>Delete</button>
                  </div>
                )}
                {confirmingId === item.id && (
                  <div className="confirm-row">
                    <Mascot expression="confused" size={32} />
                    <span className="muted">Delete this item? Your streak and past days are kept.</span>
                    <button type="button" className="danger" onClick={() => removeItem(item)}>
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmingId(null)}>Cancel</button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      </main>
    </>
  )
}

import { useEffect, useState } from 'react'
import { apiFetch, daysAgoLabel, type Item } from '../api'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // add form
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // inline edit: id of the row being edited, plus its draft values
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // id of the row currently showing the inline delete confirmation
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  async function refresh() {
    try {
      const data = await apiFetch<{ items: Item[] }>('/api/items')
      setItems(data.items)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      await apiFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, notes: newNotes }),
      })
      setNewTitle('')
      setNewNotes('')
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function startEdit(item: Item) {
    setConfirmingId(null)
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditNotes(item.notes)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await apiFetch(`/api/items/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, notes: editNotes }),
      })
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function deleteItem(item: Item) {
    try {
      await apiFetch(`/api/items/${item.id}`, { method: 'DELETE' })
      setConfirmingId(null)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main>
      <h1>My items</h1>

      <form onSubmit={addItem} className="add-form">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Something to learn or revise (15–20 min)"
          aria-label="Title"
        />
        <input
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          placeholder="Notes (optional)"
          aria-label="Notes"
        />
        <button type="submit" disabled={!newTitle.trim()}>Add</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="muted">No items yet — add the first thing you want to keep fresh.</p>
      )}

      <ul className="item-list">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id} className="item-row">
              <form onSubmit={saveEdit} className="edit-form">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  aria-label="Edit title"
                />
                <input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  aria-label="Edit notes"
                />
                <button type="submit" disabled={!editTitle.trim()}>Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            </li>
          ) : (
            <li key={item.id} className="item-row">
              <div className="item-main">
                <span className="item-title">{item.title}</span>
                {item.notes && <span className="item-notes">{item.notes}</span>}
                <span className="muted">
                  last revised {daysAgoLabel(item.lastRevisedAt)}
                  {item.revisionCount > 0 && ` · ${item.revisionCount}×`}
                </span>
              </div>
              <div className="item-actions">
                {confirmingId === item.id ? (
                  <>
                    <span className="muted">Delete forever? History goes too.</span>
                    <button type="button" className="danger" onClick={() => deleteItem(item)}>
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => startEdit(item)}>Edit</button>
                    <button type="button" onClick={() => setConfirmingId(item.id)}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </main>
  )
}

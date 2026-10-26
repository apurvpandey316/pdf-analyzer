import { useState } from 'react'
import api, { errorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'

// One flashcard in the deck list, with inline edit and delete.
export default function CardItem({ card, index, showAnswer, onSaved, onDeleted }) {
  const showToast = useToast()
  const [editing, setEditing] = useState(false)
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await api.patch(`/cards/${card._id}`, { front, back })
      onSaved(res.data.card)
      setEditing(false)
      showToast('Card saved')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this card?')) return
    try {
      await api.delete(`/cards/${card._id}`)
      onDeleted(card._id)
      showToast('Card deleted')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  if (editing) {
    return (
      <li className="rounded-xl border border-indigo-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          Front
          <textarea rows={2} value={front} onChange={(e) => setFront(e.target.value)} className={inputClass} />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Back
          <textarea rows={3} value={back} onChange={(e) => setBack(e.target.value)} className={inputClass} />
        </label>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => {
              setFront(card.front)
              setBack(card.back)
              setError('')
              setEditing(false)
            }}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">Card {index + 1}</p>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setEditing(true)} className="rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100">
            Edit
          </button>
          <button onClick={remove} className="rounded px-2 py-0.5 text-red-500 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
      <p className="mt-1 font-medium text-slate-900">{card.front}</p>
      {showAnswer && <p className="mt-2 border-t border-slate-100 pt-2 text-slate-700">{card.back}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}

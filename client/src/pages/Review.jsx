import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/client'

const BUTTONS = [
  { rating: 'again', label: 'Again', key: '1', style: 'border-red-200 text-red-700 hover:bg-red-50' },
  { rating: 'hard', label: 'Hard', key: '2', style: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { rating: 'good', label: 'Good', key: '3', style: 'border-green-200 text-green-700 hover:bg-green-50' },
  { rating: 'easy', label: 'Easy', key: '4', style: 'border-sky-200 text-sky-700 hover:bg-sky-50' },
]

export default function Review() {
  const { id: deckId } = useParams() // undefined = review all decks
  const [queue, setQueue] = useState(null)
  const [deckTitle, setDeckTitle] = useState('')
  const [total, setTotal] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/review', { params: deckId ? { deck: deckId } : {} })
      .then((res) => {
        setQueue(res.data.cards)
        setTotal(res.data.total)
        setDeckTitle(res.data.deck?.title ?? '')
      })
      .catch((err) => setError(errorMessage(err)))
  }, [deckId])

  const card = queue?.[0]

  const rate = useCallback(
    async (rating) => {
      if (!card || saving) return
      setSaving(true)
      setError('')
      try {
        await api.post(`/review/${card._id}`, { rating })
        setReviewed((n) => n + 1)
        // "Again" cards come back at the end of this session.
        setQueue((q) => (rating === 'again' ? [...q.slice(1), q[0]] : q.slice(1)))
        setFlipped(false)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setSaving(false)
      }
    },
    [card, saving],
  )

  // Keyboard: Space/Enter flips, 1-4 rate.
  useEffect(() => {
    function onKey(e) {
      if (!card) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped) {
        const button = BUTTONS.find((b) => b.key === e.key)
        if (button) rate(button.rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, flipped, rate])

  const backLink = deckId ? `/decks/${deckId}` : '/dashboard'

  if (error && !queue) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>
      </main>
    )
  }
  if (!queue) return <p className="px-4 py-10 text-center text-slate-500">Loading…</p>

  if (!card) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {reviewed ? 'Session complete' : 'Nothing to review'}
        </h1>
        <p className="mt-2 text-slate-600">
          {reviewed
            ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. Come back later for the next ones.`
            : 'No cards are due right now. Come back later.'}
        </p>
        {total > reviewed && reviewed > 0 && (
          <p className="mt-1 text-sm text-slate-500">More cards are due - reload to continue.</p>
        )}
        <Link
          to={backLink}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Done
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link to={backLink} className="hover:text-slate-700">
          ← {deckTitle || 'Dashboard'}
        </Link>
        <span>
          {queue.length} left · {reviewed} reviewed
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(true)}
        disabled={flipped}
        className="mt-4 flex min-h-[18rem] w-full flex-col justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm enabled:cursor-pointer enabled:hover:border-indigo-300"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Question</p>
        <p className="mt-2 text-xl font-medium text-slate-900">{card.front}</p>
        {flipped ? (
          <>
            <hr className="my-6 border-slate-100" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Answer</p>
            <p className="mt-2 text-lg text-slate-700">{card.back}</p>
          </>
        ) : (
          <p className="mt-8 text-sm text-slate-400">Click or press Space to show the answer</p>
        )}
      </button>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {flipped && (
        <>
          <p className="mt-6 text-center text-sm text-slate-600">How well did you remember it?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUTTONS.map((b) => (
              <button
                key={b.rating}
                onClick={() => rate(b.rating)}
                disabled={saving}
                className={`rounded-lg border bg-white px-3 py-2 disabled:opacity-50 ${b.style}`}
              >
                <span className="block font-medium">{b.label}</span>
                <span className="block text-xs opacity-75">
                  {card.preview[b.rating]} · key {b.key}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

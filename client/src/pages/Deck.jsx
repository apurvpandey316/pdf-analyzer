import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import CardItem from '../components/CardItem'
import { useToast } from '../context/ToastContext'

export default function Deck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showAnswers, setShowAnswers] = useState(false)

  useEffect(() => {
    api
      .get(`/decks/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  async function handleDelete() {
    if (!window.confirm('Delete this deck and all its cards? This cannot be undone.')) return
    try {
      await api.delete(`/decks/${id}`)
      showToast('Deck deleted')
      navigate('/dashboard')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function handleCardSaved(updated) {
    setData((d) => ({ ...d, cards: d.cards.map((c) => (c._id === updated._id ? updated : c)) }))
  }

  function handleCardDeleted(cardId) {
    setData((d) => {
      const removed = d.cards.find((c) => c._id === cardId)
      const wasDue = removed && new Date(removed.dueDate) <= new Date()
      return {
        ...d,
        cards: d.cards.filter((c) => c._id !== cardId),
        dueCount: d.dueCount - (wasDue ? 1 : 0),
      }
    })
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </main>
    )
  }
  if (!data) return <p className="px-4 py-10 text-center text-slate-500">Loading…</p>

  const { deck, cards, dueCount, quizQuestionCount } = data

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to dashboard
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{deck.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {cards.length} flashcards · {quizQuestionCount} quiz questions
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="self-start rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Delete deck
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to={`/decks/${id}/review`}
          className="rounded-xl border border-indigo-200 bg-indigo-600 p-4 text-white hover:bg-indigo-700"
        >
          <p className="font-semibold">Study flashcards</p>
          <p className="mt-0.5 text-sm text-indigo-100">
            {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? '' : 's'} due now` : 'All caught up'}
          </p>
        </Link>
        {quizQuestionCount > 0 ? (
          <Link
            to={`/decks/${id}/quiz`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300"
          >
            <p className="font-semibold text-slate-900">Take the quiz</p>
            <p className="mt-0.5 text-sm text-slate-500">{quizQuestionCount} multiple-choice questions</p>
          </Link>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-400">
            <p className="font-semibold">No quiz for this deck</p>
          </div>
        )}
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Cards</h2>
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {showAnswers ? 'Hide answers' : 'Show answers'}
        </button>
      </div>

      <ol className="mt-3 space-y-3">
        {cards.map((card, i) => (
          <CardItem
            key={card._id}
            card={card}
            index={i}
            showAnswer={showAnswers}
            onSaved={handleCardSaved}
            onDeleted={handleCardDeleted}
          />
        ))}
      </ol>
    </main>
  )
}

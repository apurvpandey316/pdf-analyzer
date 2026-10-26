import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/client'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Quiz() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/decks/${id}/quiz`)
      .then((res) => {
        setQuiz(res.data)
        setAnswers(Array(res.data.questions.length).fill(null))
      })
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  function choose(qIndex, option) {
    if (result) return
    setAnswers((a) => a.map((v, i) => (i === qIndex ? option : v)))
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post(`/decks/${id}/quiz/attempts`, { answers })
      setResult(res.data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    setResult(null)
    setAnswers(Array(quiz.questions.length).fill(null))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (error && !quiz) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>
        <Link to={`/decks/${id}`} className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to deck
        </Link>
      </main>
    )
  }
  if (!quiz) return <p className="px-4 py-10 text-center text-slate-500">Loading…</p>

  const answeredCount = answers.filter((a) => a !== null).length
  const percent = result && Math.round((result.score / result.total) * 100)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link to={`/decks/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
        ← {quiz.deck.title}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Quiz</h1>
      {!result && quiz.bestPercent !== null && (
        <p className="mt-1 text-sm text-slate-500">
          Best score so far: {quiz.bestPercent}% · {quiz.attemptCount} attempt
          {quiz.attemptCount === 1 ? '' : 's'}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-4xl font-bold text-slate-900">
            {result.score} / {result.total}
          </p>
          <p className="mt-1 text-slate-600">
            {percent}% · best {result.bestPercent}%
          </p>
          <button
            onClick={retry}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      )}

      <ol className="mt-6 space-y-4">
        {quiz.questions.map((q, qi) => {
          const r = result?.results[qi]
          return (
            <li key={qi} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">
                {qi + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, oi) => {
                  const selected = answers[qi] === oi
                  let style = selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                  if (r) {
                    if (oi === r.correctIndex) style = 'border-green-500 bg-green-50'
                    else if (selected) style = 'border-red-400 bg-red-50'
                    else style = 'border-slate-200 opacity-70'
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => choose(qi, oi)}
                      disabled={!!result}
                      aria-pressed={selected}
                      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-slate-800 ${style}`}
                    >
                      <span className="font-medium text-slate-500">{LETTERS[oi]}</span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>
              {r && (
                <p className={`mt-3 text-sm ${r.correct ? 'text-green-700' : 'text-red-700'}`}>
                  {r.correct ? 'Correct.' : r.chosen === null ? 'Not answered.' : 'Incorrect.'}{' '}
                  <span className="text-slate-600">{r.explanation}</span>
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!result && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 py-4">
          <p className="text-sm text-slate-600">
            {answeredCount} of {quiz.questions.length} answered
          </p>
          <button
            onClick={submit}
            disabled={submitting || answeredCount < quiz.questions.length}
            className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Checking…' : 'Submit answers'}
          </button>
        </div>
      )}
    </main>
  )
}

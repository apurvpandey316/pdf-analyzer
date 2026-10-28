import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const MAX_MB = 10

export default function Upload() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const inputRef = useRef(null)

  const [models, setModels] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/models').then((res) => setModels(res.data.models))
  }, [])

  // Only one model for now; the picker appears once more are enabled on the server.
  const model = models[0]
  const cost = model?.credits ?? 1
  const notEnoughCredits = user.credits < cost

  function pickFile(f) {
    setError('')
    if (!f) return
    if (f.type !== 'application/pdf') return setError('Please choose a PDF file')
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File is too large (max ${MAX_MB} MB)`)
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return setError('Please choose a PDF file')
    setError('')
    setLoading(true)

    const form = new FormData()
    form.append('file', file)
    if (model) form.append('model', model.key)
    if (title.trim()) form.append('title', title.trim())

    try {
      const res = await api.post('/documents', form)
      await refreshUser() // update the credit balance in the navbar
      showToast(`Deck created with ${res.data.deck.cardCount} flashcards`)
      navigate(`/decks/${res.data.deck._id}`)
    } catch (err) {
      setError(errorMessage(err))
      await refreshUser()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Create a deck from a PDF</h1>
      <p className="mt-1 text-slate-600">
        We'll read your PDF and generate flashcards and a quiz.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !loading && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pickFile(e.dataTransfer.files[0])
          }}
          className={`cursor-pointer rounded-xl border-2 border-dashed bg-white p-10 text-center transition ${
            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files[0])}
          />
          {file ? (
            <>
              <p className="font-medium text-slate-800">{file.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB · click to choose another
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-slate-800">Drop your PDF here or click to browse</p>
              <p className="mt-1 text-sm text-slate-500">
                Up to {MAX_MB} MB and 50 pages. Scanned PDFs aren't supported yet.
              </p>
            </>
          )}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Deck title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Leave empty to let the AI name it"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Costs <span className="font-semibold text-slate-900">{cost} credit{cost > 1 && 's'}</span>{' '}
            · you have {user.credits}
          </p>
          <button
            type="submit"
            disabled={loading || !file || notEnoughCredits}
            className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Generating… (up to a minute)' : 'Generate flashcards'}
          </button>
        </div>
        {notEnoughCredits && (
          <p className="text-sm text-amber-700">
            You don't have enough credits for this.{' '}
            <Link to="/credits" className="font-medium underline">
              Buy credits
            </Link>
          </p>
        )}
      </form>
    </main>
  )
}

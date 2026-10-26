import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [decks, setDecks] = useState(null)
  const [totalDue, setTotalDue] = useState(0)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/decks')
      .then((res) => {
        setDecks(res.data.decks)
        setTotalDue(res.data.totalDue)
      })
      .catch((err) => setError(errorMessage(err)))

    // The server needs the timezone to know when "today" starts for this user.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    api
      .get('/stats', { params: { tz } })
      .then((res) => setStats(res.data))
      .catch(() => {}) // stats are a nice-to-have; the deck list still works without them
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-slate-600">
            {stats?.streak
              ? `You're on a ${stats.streak}-day streak. Keep it going!`
              : 'Study a little every day to build a streak.'}
          </p>
        </div>
        <Link
          to="/upload"
          className="self-start rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 sm:self-auto"
        >
          + New deck from PDF
        </Link>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Day streak" value={stats?.streak} suffix={stats?.streak ? ' 🔥' : ''} />
        <StatTile label="Due today" value={stats?.dueToday} />
        <StatTile label="Reviewed today" value={stats?.reviewedToday} />
        <StatTile label="Credits left" value={user.credits} />
      </dl>

      {totalDue > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-indigo-900">
              {totalDue} card{totalDue === 1 ? '' : 's'} due for review
            </p>
            <p className="text-sm text-indigo-700">A few minutes a day keeps them in memory.</p>
          </div>
          <Link
            to="/review"
            className="self-start rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 sm:self-auto"
          >
            Review now
          </Link>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Your decks</h2>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {!decks && !error && <p className="mt-3 text-slate-500">Loading…</p>}

      {decks?.length === 0 && (
        <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">No decks yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a PDF of your notes to create your first deck.
          </p>
        </div>
      )}

      {decks?.length > 0 && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck._id}>
              <Link
                to={`/decks/${deck._id}`}
                className="block h-full rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{deck.title}</p>
                  {deck.dueCount > 0 && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {deck.dueCount} due
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {deck.cardCount} cards · {new Date(deck.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function StatTile({ label, value, suffix = '' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-slate-900">
        {value ?? '–'}
        {suffix}
      </dd>
    </div>
  )
}

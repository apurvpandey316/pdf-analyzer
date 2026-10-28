import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { loadCheckout } from '../api/razorpay'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TYPE_LABELS = {
  signup_bonus: 'Welcome bonus',
  purchase: 'Purchase',
  generation: 'Deck generated',
  refund: 'Refund',
  grant: 'Free credits',
}

const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`

export default function Credits() {
  const { user, refreshUser } = useAuth()
  const showToast = useToast()

  const [packs, setPacks] = useState([])
  const [enabled, setEnabled] = useState(true)
  const [transactions, setTransactions] = useState(null)
  const [buying, setBuying] = useState(null) // key of the pack being bought
  const [error, setError] = useState('')

  const loadTransactions = useCallback(() => {
    api
      .get('/payments/transactions')
      .then((res) => setTransactions(res.data.transactions))
      .catch((err) => setError(errorMessage(err)))
  }, [])

  useEffect(() => {
    api.get('/payments/packs').then((res) => {
      setPacks(res.data.packs)
      setEnabled(res.data.enabled)
    })
    loadTransactions()
  }, [loadTransactions])

  async function buy(pack) {
    setError('')
    setBuying(pack.key)
    try {
      const [{ data: order }] = await Promise.all([
        api.post('/payments/order', { pack: pack.key }),
        loadCheckout(),
      ])

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'PDF Analyzer',
        description: `${order.credits} credits (${order.label})`,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', response)
            showToast(`${order.credits} credits added`)
          } catch {
            // The webhook still adds the credits once Razorpay confirms the payment.
            showToast('Payment received. Your credits will appear in a minute.', 'info')
          } finally {
            await refreshUser()
            loadTransactions()
            setBuying(null)
          }
        },
        modal: { ondismiss: () => setBuying(null) },
      })
      checkout.on('payment.failed', (res) => {
        showToast(res.error?.description || 'Payment failed. You were not charged.', 'error')
      })
      checkout.open()
    } catch (err) {
      setError(err.response ? errorMessage(err) : err.message)
      setBuying(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Credits</h1>
      <p className="mt-1 text-slate-600">
        You have <span className="font-semibold text-slate-900">{user.credits}</span> credits. Each
        deck you generate uses credits.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!enabled && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Buying credits isn't available yet.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {packs.map((pack) => (
          <div key={pack.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-indigo-700">{pack.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{pack.credits} credits</p>
            <p className="mt-1 text-slate-600">{rupees(pack.amountPaise)}</p>
            <button
              onClick={() => buy(pack)}
              disabled={!enabled || buying !== null}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {buying === pack.key ? 'Opening payment…' : `Buy for ${rupees(pack.amountPaise)}`}
            </button>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">History</h2>
      {transactions === null ? (
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No credit changes yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {transactions.map((t) => (
            <li key={t._id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{TYPE_LABELS[t.type] ?? t.type}</p>
                <p className="truncate text-slate-500">
                  {new Date(t.createdAt).toLocaleString()}
                  {t.description && ` · ${t.description}`}
                  {t.amountPaise && ` · ${rupees(t.amountPaise)}`}
                </p>
              </div>
              <span
                className={`shrink-0 font-semibold ${t.credits > 0 ? 'text-green-700' : 'text-slate-600'}`}
              >
                {t.credits > 0 ? `+${t.credits}` : t.credits}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

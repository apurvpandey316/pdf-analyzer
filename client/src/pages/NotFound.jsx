import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you're looking for doesn't exist or was moved.</p>
      <Link
        to={user ? '/dashboard' : '/'}
        className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
      >
        {user ? 'Go to dashboard' : 'Go home'}
      </Link>
    </main>
  )
}

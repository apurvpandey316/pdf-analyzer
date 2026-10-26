import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  async function handleLogout() {
    // Leave the protected page first, otherwise its guard redirects to /login.
    navigate('/')
    await logout()
    showToast('You have been logged out', 'info')
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="text-lg font-bold text-slate-900">
          PDF Analyzer
        </Link>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
              {user.credits} credits
            </span>
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

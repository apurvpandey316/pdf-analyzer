import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const showToast = useToast()
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Re-fetches the logged-in user (also used to refresh the credit balance).
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  // If the session expires while the app is open, any API call returns 401.
  // Log the user out locally so the route guard sends them to the login page.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (err) => {
      const url = err.config?.url ?? ''
      // userRef makes sure several failing requests at once show only one message.
      if (err.response?.status === 401 && !url.startsWith('/auth/') && userRef.current) {
        userRef.current = null
        setUser(null)
        showToast('Your session expired. Please log in again.', 'info')
      }
      return Promise.reject(err)
    })
    return () => api.interceptors.response.eject(id)
  }, [showToast])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    setUser(res.data.user)
  }

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password })
    setUser(res.data.user)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

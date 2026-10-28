import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { GuestRoute, ProtectedRoute } from './components/RouteGuards'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Credits from './pages/Credits'
import Dashboard from './pages/Dashboard'
import Deck from './pages/Deck'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Quiz from './pages/Quiz'
import Register from './pages/Register'
import Review from './pages/Review'
import Upload from './pages/Upload'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/decks/:id" element={<Deck />} />
                <Route path="/decks/:id/review" element={<Review />} />
                <Route path="/decks/:id/quiz" element={<Quiz />} />
                <Route path="/review" element={<Review />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

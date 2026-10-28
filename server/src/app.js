import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import env from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import cardRoutes from './routes/cards.js'
import deckRoutes from './routes/decks.js'
import documentRoutes from './routes/documents.js'
import healthRoutes from './routes/health.js'
import modelRoutes from './routes/models.js'
import paymentRoutes from './routes/payments.js'
import reviewRoutes from './routes/review.js'
import statsRoutes from './routes/stats.js'

const app = express()

// Hosts like Render/Railway sit behind a proxy; this makes req.ip the real client IP
// so rate limits apply per user instead of to everyone at once.
if (env.nodeEnv === 'production') app.set('trust proxy', 1)

// Helmet's default Content Security Policy, plus the Razorpay Checkout script and popup.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://checkout.razorpay.com'],
        'frame-src': ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        'connect-src': ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
        'img-src': ["'self'", 'data:', 'https://*.razorpay.com'],
      },
    },
  }),
)
// In development, accept the client on any localhost port (Vite may pick 5174 if 5173 is busy).
const corsOrigin = env.nodeEnv === 'development' ? /^http:\/\/localhost:\d+$/ : env.clientUrl
app.use(cors({ origin: corsOrigin, credentials: true }))
// Razorpay signs the exact webhook bytes, so that route gets the raw body instead of parsed JSON.
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Overall safety net: 600 API requests per 15 minutes per IP.
// Stricter limits on login and AI generation live in their own routes.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down and try again shortly' },
  }),
)

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/models', modelRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/decks', deckRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api', notFound)

// In production the server also serves the built React app (client/dist), so the website
// and API share one domain - the login cookie then works in every browser.
if (env.nodeEnv === 'production') {
  const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url))
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }))
  // Any other page (e.g. /dashboard) loads index.html and React Router takes over.
  // Paths with a file extension (e.g. a missing /assets/x.js) fall through to a real 404.
  app.get('/{*path}', (req, res, next) => {
    if (path.extname(req.path)) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app

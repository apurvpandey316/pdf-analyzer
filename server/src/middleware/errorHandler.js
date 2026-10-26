import multer from 'multer'
import env from '../config/env.js'
import { MAX_FILE_MB } from '../services/pdf.js'

export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` })
}

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Upload errors from multer (e.g. file too large)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? `File is too large (max ${MAX_FILE_MB} MB)` : err.message
    return res.status(400).json({ error: message })
  }
  // Malformed MongoDB id in the URL, e.g. /api/decks/abc
  if (err.name === 'CastError') {
    return res.status(404).json({ error: 'Not found' })
  }

  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    error: status >= 500 && env.nodeEnv === 'production' ? 'Something went wrong' : err.message,
  })
}

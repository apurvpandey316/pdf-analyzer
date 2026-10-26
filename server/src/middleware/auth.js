import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import User from '../models/User.js'
import HttpError from '../utils/httpError.js'

export const AUTH_COOKIE = 'token'

// Rejects the request unless a valid login cookie is present; sets req.user.
export async function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE]
  if (!token) throw new HttpError(401, 'Please log in')

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new HttpError(401, 'Session expired, please log in again')
  }

  const user = await User.findById(payload.sub)
  if (!user) throw new HttpError(401, 'Account not found')

  req.user = user
  next()
}

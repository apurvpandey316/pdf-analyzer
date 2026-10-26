import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { SIGNUP_CREDITS } from '../config/credits.js'
import env from '../config/env.js'
import { AUTH_COOKIE } from '../middleware/auth.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import HttpError from '../utils/httpError.js'

const SESSION_DAYS = 7

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: `${SESSION_DAYS}d`,
  })
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript
    secure: env.nodeEnv === 'production', // HTTPS only in production
    sameSite: 'lax', // website and API share one domain
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  })
}

export async function register(req, res) {
  const { name, email, password } = req.body

  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash, credits: SIGNUP_CREDITS })
  await Transaction.create({
    user: user._id,
    type: 'signup_bonus',
    credits: SIGNUP_CREDITS,
    description: 'Welcome bonus',
  })

  setAuthCookie(res, user)
  res.status(201).json({ user: user.toPublic() })
}

export async function login(req, res) {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+passwordHash')
  // Same message for wrong email and wrong password, so emails can't be probed.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Incorrect email or password')
  }

  setAuthCookie(res, user)
  res.json({ user: user.toPublic() })
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax', // website and API share one domain
  })
  res.json({ ok: true })
}

export function me(req, res) {
  res.json({ user: req.user.toPublic() })
}

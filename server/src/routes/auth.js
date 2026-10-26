import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { login, logout, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

// 20 attempts per 15 minutes per IP on register/login, to slow down password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in a few minutes' },
})

const email = z.email('Enter a valid email').trim().toLowerCase()

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
})

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router

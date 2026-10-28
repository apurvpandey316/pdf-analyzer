import { Router } from 'express'
import { z } from 'zod'
import { CREDIT_PACKS } from '../config/credits.js'
import {
  createOrder,
  handleWebhook,
  listPacks,
  listTransactions,
  verifyPayment,
} from '../controllers/paymentController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const orderSchema = z.object({
  pack: z.enum(Object.keys(CREDIT_PACKS), 'Unknown credit pack'),
})

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

router.get('/packs', listPacks)
router.get('/transactions', requireAuth, listTransactions)
router.post('/order', requireAuth, validate(orderSchema), createOrder)
router.post('/verify', requireAuth, validate(verifySchema), verifyPayment)
// The raw body for this route is set up in app.js (signatures are computed over the exact bytes).
router.post('/webhook', handleWebhook)

export default router

import { CREDIT_PACKS, publicPacks } from '../config/credits.js'
import env from '../config/env.js'
import PaymentOrder from '../models/PaymentOrder.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import { creditPaidOrder } from '../services/credits.js'
import {
  createOrder as createRazorpayOrder,
  paymentsEnabled,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpay.js'
import HttpError from '../utils/httpError.js'

// GET /api/payments/packs
export function listPacks(req, res) {
  res.json({ packs: publicPacks(), enabled: paymentsEnabled() })
}

// POST /api/payments/order { pack }
// Creates a Razorpay order; the browser opens Checkout with the returned details.
export async function createOrder(req, res) {
  const pack = CREDIT_PACKS[req.body.pack]
  const receipt = `u${req.user._id.toString().slice(-8)}-${Date.now()}`
  const rzpOrder = await createRazorpayOrder(pack.amountPaise, receipt)

  await PaymentOrder.create({
    user: req.user._id,
    pack: req.body.pack,
    credits: pack.credits,
    amountPaise: pack.amountPaise,
    razorpayOrderId: rzpOrder.id,
  })

  res.status(201).json({
    keyId: env.razorpay.keyId,
    orderId: rzpOrder.id,
    amountPaise: pack.amountPaise,
    credits: pack.credits,
    label: pack.label,
  })
}

// POST /api/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Called by the browser right after Checkout succeeds.
export async function verifyPayment(req, res) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    req.body

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    throw new HttpError(400, 'Payment could not be verified')
  }
  const order = await PaymentOrder.findOne({ razorpayOrderId: orderId, user: req.user._id })
  if (!order) throw new HttpError(404, 'Order not found')

  await creditPaidOrder(orderId, paymentId)
  const { credits } = await User.findById(req.user._id).select('credits')
  res.json({ credits })
}

// POST /api/payments/webhook (raw body, called by Razorpay)
// Backup for when the browser closes before /verify runs. Credits are never added twice.
export async function handleWebhook(req, res) {
  if (!env.razorpay.webhookSecret) {
    console.error('[razorpay] Webhook received but RAZORPAY_WEBHOOK_SECRET is not set')
    throw new HttpError(503, 'Webhook not configured')
  }
  if (!Buffer.isBuffer(req.body) || !verifyWebhookSignature(req.body, req.get('X-Razorpay-Signature'))) {
    throw new HttpError(400, 'Invalid signature')
  }

  const event = JSON.parse(req.body.toString('utf8'))
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const order = await PaymentOrder.findOne({ razorpayOrderId: payment.order_id })
    if (!order) {
      // Not one of ours (e.g. a payment made from the Razorpay dashboard). Acknowledge and ignore.
      console.warn(`[razorpay] Webhook for unknown order ${payment.order_id}`)
    } else if (payment.amount !== order.amountPaise) {
      console.error(`[razorpay] Amount mismatch on order ${payment.order_id}`)
    } else {
      await creditPaidOrder(payment.order_id, payment.id)
    }
  }

  // Any 2xx tells Razorpay the event was received, so it stops retrying.
  res.json({ ok: true })
}

// GET /api/payments/transactions - latest credit changes for the history page
export async function listTransactions(req, res) {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('type credits description amountPaise createdAt')
  res.json({ transactions })
}

import crypto from 'node:crypto'
import env from '../config/env.js'
import HttpError from '../utils/httpError.js'

const API_URL = 'https://api.razorpay.com/v1'

export function paymentsEnabled() {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret)
}

// Creates an order on Razorpay. The browser then opens Checkout for this order.
export async function createOrder(amountPaise, receipt) {
  if (!paymentsEnabled()) throw new HttpError(503, 'Payments are not set up yet')

  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64')
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('[razorpay] Order failed:', data.error?.description ?? res.status)
    throw new HttpError(502, 'Could not start the payment. Please try again.')
  }
  return data
}

function hmacMatches(payload, secret, signature) {
  if (typeof signature !== 'string') return false
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  // timingSafeEqual stops attackers guessing the signature byte by byte.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Signature that Checkout returns to the browser after a successful payment.
export function verifyPaymentSignature(orderId, paymentId, signature, secret = env.razorpay.keySecret) {
  return hmacMatches(`${orderId}|${paymentId}`, secret, signature)
}

// Signature Razorpay puts in the X-Razorpay-Signature header of every webhook,
// computed over the raw request body.
export function verifyWebhookSignature(rawBody, signature, secret = env.razorpay.webhookSecret) {
  return hmacMatches(rawBody, secret, signature)
}

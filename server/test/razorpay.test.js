import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { test } from 'node:test'
import { verifyPaymentSignature, verifyWebhookSignature } from '../src/services/razorpay.js'

const SECRET = 'test_secret'
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('hex')

test('accepts the checkout signature Razorpay computes over order_id|payment_id', () => {
  const signature = sign('order_123|pay_456')
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', signature, SECRET), true)
})

test('rejects a checkout signature for a different payment or secret', () => {
  const signature = sign('order_123|pay_456')
  assert.equal(verifyPaymentSignature('order_123', 'pay_999', signature, SECRET), false)
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', signature, 'other'), false)
})

test('rejects missing or malformed signatures without throwing', () => {
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', undefined, SECRET), false)
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', 'abc', SECRET), false)
})

test('webhook signature is checked against the exact raw body', () => {
  const body = Buffer.from('{"event":"payment.captured"}')
  const signature = sign(body)
  assert.equal(verifyWebhookSignature(body, signature, SECRET), true)
  // Same JSON, different bytes (extra space) must fail.
  assert.equal(verifyWebhookSignature(Buffer.from('{"event": "payment.captured"}'), signature, SECRET), false)
})

import mongoose from 'mongoose'

// A Razorpay order we created. Both /payments/verify and the webhook look it up,
// so we always know which user and pack a payment belongs to.
const paymentOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pack: { type: String, required: true },
    credits: { type: Number, required: true },
    amountPaise: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['created', 'paid'], default: 'created' },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true },
)

export default mongoose.model('PaymentOrder', paymentOrderSchema)

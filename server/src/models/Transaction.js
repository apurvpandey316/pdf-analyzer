import mongoose from 'mongoose'

// Every change to a user's credit balance is recorded here.
const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['signup_bonus', 'purchase', 'generation', 'refund'],
      required: true,
    },
    credits: { type: Number, required: true }, // positive = added, negative = spent
    description: { type: String },

    // Purchases only
    amountPaise: { type: Number }, // ₹1 = 100 paise
    razorpayOrderId: { type: String },
    // unique + sparse: a payment can never be credited twice
    razorpayPaymentId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
)

export default mongoose.model('Transaction', transactionSchema)

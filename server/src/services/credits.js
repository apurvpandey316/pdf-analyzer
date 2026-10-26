import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import HttpError from '../utils/httpError.js'

// Deducts credits atomically: the update only matches if the balance is high enough,
// so two requests at the same time can never take the balance below zero.
export async function spendCredits(userId, amount, description) {
  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: amount } },
    { $inc: { credits: -amount } },
    { new: true },
  )
  if (!user) {
    throw new HttpError(402, `Not enough credits. This needs ${amount}.`)
  }
  await Transaction.create({ user: userId, type: 'generation', credits: -amount, description })
  return user.credits
}

// Gives credits back when generation fails after they were deducted.
export async function refundCredits(userId, amount, description) {
  await User.updateOne({ _id: userId }, { $inc: { credits: amount } })
  await Transaction.create({ user: userId, type: 'refund', credits: amount, description })
}

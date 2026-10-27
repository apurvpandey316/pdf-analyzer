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

// Gives free credits to a user by email (used by scripts/grant-credits.js).
// Returns the user's new balance.
export async function grantCredits(email, amount, description = 'Free credits') {
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $inc: { credits: amount } },
    { new: true },
  )
  if (!user) {
    throw new HttpError(404, `No user with email ${email}`)
  }
  await Transaction.create({ user: user._id, type: 'grant', credits: amount, description })
  return user.credits
}

// Reads `<email> <amount> [description...]` from the command line.
export function parseGrantArgs(args) {
  const [email, rawAmount, ...rest] = args
  const amount = Number(rawAmount)
  if (!email || !email.includes('@')) {
    throw new Error('First argument must be the user\'s email')
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Second argument must be a positive whole number of credits')
  }
  return { email, amount, description: rest.join(' ') || undefined }
}

// Gives credits back when generation fails after they were deducted.
export async function refundCredits(userId, amount, description) {
  await User.updateOne({ _id: userId }, { $inc: { credits: amount } })
  await Transaction.create({ user: userId, type: 'refund', credits: amount, description })
}

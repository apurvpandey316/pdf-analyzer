// Gives free credits to a user and records it as a 'grant' Transaction.
// Usage (from server/): npm run grant-credits -- <email> <amount> [description]
// Example:             npm run grant-credits -- someone@example.com 50 Beta tester bonus

import mongoose from 'mongoose'
import env from '../src/config/env.js'
import { grantCredits, parseGrantArgs } from '../src/services/credits.js'

try {
  const { email, amount, description } = parseGrantArgs(process.argv.slice(2))
  if (!env.mongoUri) throw new Error('MONGO_URI is not set in server/.env')

  await mongoose.connect(env.mongoUri)
  const balance = await grantCredits(email, amount, description)
  console.log(`Gave ${amount} credits to ${email}. New balance: ${balance}`)
} catch (err) {
  console.error(`Error: ${err.message}`)
  console.error('Usage: npm run grant-credits -- <email> <amount> [description]')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}

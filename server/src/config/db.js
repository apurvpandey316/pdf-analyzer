import mongoose from 'mongoose'
import env from './env.js'

export async function connectDB() {
  if (!env.mongoUri) {
    console.warn('[db] MONGO_URI not set - running without a database')
    return
  }
  try {
    await mongoose.connect(env.mongoUri)
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`)
  } catch (err) {
    console.error('[db] Connection failed:', err.message)
  }
}

export function dbStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}

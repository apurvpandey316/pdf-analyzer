// Reads environment variables in one place. Values come from server/.env
// (loaded by `node --env-file-if-exists=.env`, see package.json scripts).

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    model: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
}

const missing = []
if (!env.mongoUri) missing.push('MONGO_URI')
if (!env.jwtSecret) missing.push('JWT_SECRET')
if (env.ai.provider === 'gemini' && !env.ai.geminiApiKey) missing.push('GEMINI_API_KEY')
if (missing.length) {
  // In production a missing value is a deploy mistake: stop with a clear message
  // instead of starting a site where login or uploads silently fail.
  if (env.nodeEnv === 'production') {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
  console.warn(`[env] Missing in server/.env: ${missing.join(', ')}`)
}

export default env

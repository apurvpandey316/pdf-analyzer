import { GoogleGenAI } from '@google/genai'
import env from '../../config/env.js'

// Tried in order if the main model is overloaded (free-tier models often return 503).
const FALLBACK_MODELS = ['gemini-3.5-flash']
const RETRIES_PER_MODEL = 2
// Overloaded / rate-limited / timeout: worth retrying. Anything else (bad key, bad request) is not.
const RETRYABLE = new Set([429, 500, 503, 504])

let client
function getClient() {
  if (!env.ai.geminiApiKey) throw new Error('GEMINI_API_KEY is not set')
  client ??= new GoogleGenAI({ apiKey: env.ai.geminiApiKey })
  return client
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function callModel(model, { system, prompt, jsonSchema }) {
  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema,
      temperature: 0.4,
    },
  })
  return response.text
}

// Returns the raw JSON text from the model. Validation happens in services/ai.js.
export async function generate({ model, ...request }) {
  const models = [model, ...FALLBACK_MODELS.filter((m) => m !== model)]
  let lastError

  for (const m of models) {
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      try {
        return await callModel(m, request)
      } catch (err) {
        lastError = err
        if (!RETRYABLE.has(err.status)) throw err
        console.warn(`[ai] ${m} busy (${err.status}), attempt ${attempt + 1}`)
        if (attempt < RETRIES_PER_MODEL) await sleep(1500 * 2 ** attempt) // 1.5s, 3s
      }
    }
  }
  throw lastError
}

import env from './env.js'

// Single source of truth for which AI models users may pick and what they cost.
// The client only ever sends a key from this list; the server decides the real model.
export const MODELS = {
  standard: {
    label: 'Standard',
    description: 'Fast and free while in development',
    provider: env.ai.provider,
    model: env.ai.model,
    credits: 1,
  },
  // Later, e.g.:
  // fast:     { label: 'Fast',     provider: 'claude', model: 'claude-haiku-5-5',  credits: 1 },
  // balanced: { label: 'Balanced', provider: 'claude', model: 'claude-sonnet-5-5', credits: 10 },
  // best:     { label: 'Best',     provider: 'claude', model: 'claude-opus-5-5',   credits: 20 },
}

export const DEFAULT_MODEL = 'standard'

// Safe list for the client (no provider details).
export function publicModels() {
  return Object.entries(MODELS).map(([key, m]) => ({
    key,
    label: m.label,
    description: m.description,
    credits: m.credits,
  }))
}

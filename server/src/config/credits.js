// Credits given to every new account.
export const SIGNUP_CREDITS = 10

// Packs users can buy. Prices are in paise (₹1 = 100 paise), as Razorpay expects.
// The client only ever sends a key from this list; the server decides the real price.
export const CREDIT_PACKS = {
  starter: { label: 'Starter', credits: 100, amountPaise: 4900 },
  pro: { label: 'Pro', credits: 500, amountPaise: 19900 },
}

// Safe list for the client.
export function publicPacks() {
  return Object.entries(CREDIT_PACKS).map(([key, p]) => ({ key, ...p }))
}

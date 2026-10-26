# PDF Analyzer — Build Plan

AI flashcard and quiz generator with spaced repetition and credit-based payments.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS + React Router |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas free tier) + Mongoose |
| AI | **Gemini Flash free tier** (`@google/genai`) for development. Provider is swappable via `.env` (later: Claude Haiku / Sonnet / Opus, DeepSeek, etc.) |
| PDF parsing | `pdf-parse` (extract text on the server, send text only) |
| Auth | JWT (httpOnly cookie) + bcrypt |
| Payments | Razorpay (India), credit packs |
| Spaced repetition | SM-2 algorithm (no AI, free) |

## Folder structure

```
pdf-analyzer/
├── client/          # React app
│   └── src/
│       ├── pages/       # Login, Dashboard, Upload, Deck, Review, Quiz, BuyCredits
│       ├── components/
│       ├── api/         # axios wrappers
│       └── context/     # auth + credits state
└── server/          # Express API
    └── src/
        ├── models/      # User, Document, Deck, Card, Quiz, Transaction
        ├── routes/
        ├── controllers/
        ├── services/    # ai.js, providers/ (gemini.js, later claude.js...), pdf.js, srs.js, razorpay.js
        ├── middleware/  # auth, credits check, rate limit, error handler
        └── config/      # models + credit costs
```

## AI provider strategy

- **Now (development):** Gemini Flash free tier, which costs ₹0. It has rate limits, and Google may use free-tier data for training, so it isn't for real users.
- **Later (real users):** switch to a paid model by changing `AI_PROVIDER` / `AI_MODEL` in `.env`. Cheapest options per PDF: DeepSeek V4-Flash ~₹0.18, Claude Haiku 5.5 ~₹0.26.
- All AI calls go through **one file** (`services/ai.js`) with one function, `generateStudySet(text, model)`. Each provider is a small adapter in `services/providers/`.
- The model dropdown (Fast / Balanced / Best) is **added later**, once better models are enabled. For now there's one model, but the credit system is still built.

## Credit pricing (draft)

| Model | Label in UI | Credits per generation | Approx. API cost |
|---|---|---|---|
| Gemini Flash (free tier) | Standard (only option for now) | 1 | ₹0 |
| *Later:* cheap paid model | Fast | 1 | ~₹0.25 |
| *Later:* mid-tier model | Balanced | 10 | ~₹5 |
| *Later:* top-tier model | Best | 20 | ~₹10 |

- New users get **10 free credits**.
- Packs, for example: ₹49 → 100 credits, ₹199 → 500 credits. Tune these so every model stays profitable after Razorpay's ~2% fee.
- Cap PDF size (e.g. 50 pages / 10 MB) so a single generation has a predictable cost.

---

## Steps

### Phase 0 — Accounts & setup
1. Install Node.js 20+ and Git; create a GitHub repo.
2. Create a MongoDB Atlas free cluster and get the connection string.
3. Get a free Gemini API key from Google AI Studio (aistudio.google.com). No card needed.
4. Create a Razorpay account and get **test mode** keys (KYC is needed only for live mode).
5. Scaffold `client/` (Vite + React) and `server/` (Express); add `.env` files and `.gitignore`.

### Phase 1 — Backend foundation
6. Express app with CORS, JSON parsing, cookie parser, Helmet, and a central error handler.
7. Connect Mongoose and add a health-check route.
8. Mongoose models: `User` (email, passwordHash, credits), `Document`, `Deck`, `Card` (front, back, SM-2 fields), `Quiz`, `Transaction`.

### Phase 2 — Auth
9. Register and login routes (bcrypt + JWT in an httpOnly cookie), `/me` route, and auth middleware.
10. Frontend login and register pages, an auth context, and protected routes.

### Phase 3 — PDF upload & AI generation
11. Upload route using `multer` (in memory, with size and type limits), then `pdf-parse` to extract the text.
12. `config/models.js`: the single source of truth for allowed models, their provider and their credit cost (only Gemini Flash enabled for now).
13. `services/ai.js` + `services/providers/gemini.js`: send the text and get back flashcards plus a quiz as validated JSON. The provider and model come from `.env`, so switching later means changing config, not code.
14. Credits middleware: check the balance, deduct **atomically** before the call, and refund if the call fails.
15. Save the deck, cards and quiz in MongoDB.
16. Frontend: upload page showing the credit cost, with a loading state. (The model dropdown is added later, when more models are enabled.)

### Phase 4 — Study features
17. Deck list and deck detail pages (view and edit cards).
18. `services/srs.js`: SM-2 algorithm. A review is rated Again / Hard / Good / Easy, which updates the interval and the next review date.
19. Review page: cards due today, flip animation, rating buttons.
20. Quiz page: multiple choice graded in code (no AI cost), with a score summary.

### Phase 5 — Payments (Razorpay)
21. Buy Credits page showing the packs.
22. Backend `POST /payments/order` creates a Razorpay order; the frontend opens Razorpay Checkout.
23. `POST /payments/verify` checks the signature, then adds credits and records a `Transaction` (idempotent, so a payment is never credited twice).
24. Razorpay webhook (`payment.captured`) as a backup for when the browser closes mid-payment.
25. Credit balance in the navbar and a transaction history page.

### Phase 6 — Safety & polish
26. Rate limiting (`express-rate-limit`) on the upload, generate and auth routes.
27. Input validation (`zod`) on every route.
28. Dashboard: cards due today, study streak, credits left.
29. Responsive UI, empty states, error toasts.

### Phase 7 — Deploy
30. One Render web service runs the API and serves the built website (same domain, so login cookies work everywhere); MongoDB stays on Atlas. See DEPLOY.md.
31. Set production environment variables in Render (Razorpay webhook comes with Phase 5).
32. Test end to end in Razorpay test mode, then complete KYC and switch to live keys.

---

## Environment variables

```
# server/.env
MONGO_URI=
JWT_SECRET=
AI_PROVIDER=gemini
AI_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=
# later, e.g.: ANTHROPIC_API_KEY= / DEEPSEEK_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLIENT_URL=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=
```

## Costs to run

| Item | Cost |
|---|---|
| MongoDB Atlas (M0) | Free |
| Render (free web service) | Free (sleeps after 15 min idle) |
| Razorpay | No setup fee; ~2% per successful payment |
| AI (now) | Gemini Flash free tier: ₹0 |
| AI (later) | About ₹0.2–0.3 per PDF on a cheap paid model |

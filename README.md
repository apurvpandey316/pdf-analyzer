# PDF Analyzer

Upload a PDF, get AI-generated flashcards and quizzes, and review them with spaced repetition. See [PLAN.md](PLAN.md) for the full build plan and [DEPLOY.md](DEPLOY.md) to put it online.

## Structure

```
client/   React + Vite + Tailwind (http://localhost:5173 in development)
server/   Express + MongoDB API   (http://localhost:5000)
```

In production the server also serves the built website, so everything runs on one domain.

## Setup

1. Copy `server/.env.example` to `server/.env` and fill it in (the file explains where to get each value).
2. Copy `client/.env.example` to `client/.env.development` (already done on this machine).

## Run (two terminals)

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open http://localhost:5173. Health check: http://localhost:5000/api/health

## Give a user free credits

```bash
npm run grant-credits -- someone@example.com 50 Beta tester bonus
```

Adds the credits and records a `grant` transaction. The description is optional.

## Tests

```bash
npm test
```

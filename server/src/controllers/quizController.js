import Deck from '../models/Deck.js'
import Quiz from '../models/Quiz.js'
import HttpError from '../utils/httpError.js'

async function findOwnQuiz(req) {
  const deck = await Deck.findOne({ _id: req.params.id, user: req.user._id }).select('title').lean()
  if (!deck) throw new HttpError(404, 'Deck not found')
  const quiz = await Quiz.findOne({ deck: deck._id })
  if (!quiz || quiz.questions.length === 0) throw new HttpError(404, 'This deck has no quiz')
  return { deck, quiz }
}

function attemptSummary(quiz) {
  const scores = quiz.attempts.map((a) => a.score / a.total)
  return {
    attemptCount: quiz.attempts.length,
    bestPercent: scores.length ? Math.round(Math.max(...scores) * 100) : null,
  }
}

// GET /api/decks/:id/quiz  - questions WITHOUT the answers
export async function getQuiz(req, res) {
  const { deck, quiz } = await findOwnQuiz(req)
  res.json({
    deck,
    questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
    ...attemptSummary(quiz),
  })
}

// POST /api/decks/:id/quiz/attempts  { answers: [optionIndex | null, ...] }
// Graded on the server so the answers are never sent to the browser before submitting.
export async function submitQuiz(req, res) {
  const { quiz } = await findOwnQuiz(req)
  const { answers } = req.body
  if (answers.length !== quiz.questions.length) {
    throw new HttpError(400, 'Please answer every question')
  }

  const results = quiz.questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    chosen: answers[i],
    correctIndex: q.answerIndex,
    correct: answers[i] === q.answerIndex,
    explanation: q.explanation,
  }))
  const score = results.filter((r) => r.correct).length

  quiz.attempts.push({ answers, score, total: results.length })
  await quiz.save()

  res.json({ score, total: results.length, results, ...attemptSummary(quiz) })
}

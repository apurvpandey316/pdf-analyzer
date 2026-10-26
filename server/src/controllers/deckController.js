import Card from '../models/Card.js'
import Deck from '../models/Deck.js'
import Document from '../models/Document.js'
import Quiz from '../models/Quiz.js'
import HttpError from '../utils/httpError.js'
import { dueCountsByDeck } from './reviewController.js'

async function findOwnDeck(req) {
  const deck = await Deck.findOne({ _id: req.params.id, user: req.user._id })
  if (!deck) throw new HttpError(404, 'Deck not found')
  return deck
}

// GET /api/decks  - decks with how many cards are due, plus the total due
export async function listDecks(req, res) {
  const [decks, due] = await Promise.all([
    Deck.find({ user: req.user._id }).sort({ createdAt: -1 }).lean(),
    dueCountsByDeck(req.user._id),
  ])
  const withDue = decks.map((d) => ({ ...d, dueCount: due[d._id.toString()] ?? 0 }))
  const totalDue = withDue.reduce((sum, d) => sum + d.dueCount, 0)
  res.json({ decks: withDue, totalDue })
}

// GET /api/decks/:id  - deck with all its cards
export async function getDeck(req, res) {
  const deck = await findOwnDeck(req)
  const now = new Date()
  const [cards, quiz] = await Promise.all([
    Card.find({ deck: deck._id }).sort({ createdAt: 1 }).lean(),
    Quiz.findOne({ deck: deck._id }).select('questions').lean(),
  ])
  const dueCount = cards.filter((c) => c.dueDate <= now).length
  res.json({ deck, cards, dueCount, quizQuestionCount: quiz?.questions.length ?? 0 })
}

// DELETE /api/decks/:id  - removes the deck, its cards, quiz and source document
export async function deleteDeck(req, res) {
  const deck = await findOwnDeck(req)
  await Promise.all([
    Card.deleteMany({ deck: deck._id }),
    Quiz.deleteMany({ deck: deck._id }),
    Document.deleteOne({ _id: deck.document }),
  ])
  await deck.deleteOne()
  res.json({ ok: true })
}

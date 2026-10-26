import mongoose from 'mongoose'
import Card from '../models/Card.js'
import Deck from '../models/Deck.js'
import ReviewLog from '../models/ReviewLog.js'
import { previewIntervals, schedule } from '../services/srs.js'
import HttpError from '../utils/httpError.js'

const SESSION_SIZE = 50

// Due-card counts per deck for a user: { [deckId]: count }
export async function dueCountsByDeck(userId, now = new Date()) {
  const rows = await Card.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), dueDate: { $lte: now } } },
    { $group: { _id: '$deck', due: { $sum: 1 } } },
  ])
  return Object.fromEntries(rows.map((r) => [r._id.toString(), r.due]))
}

function withPreview(card) {
  return { ...card, preview: previewIntervals(card) }
}

// GET /api/review?deck=<id>  - cards due now (all decks, or one deck)
export async function getDueCards(req, res) {
  const filter = { user: req.user._id, dueDate: { $lte: new Date() } }

  let deck = null
  if (req.query.deck) {
    deck = await Deck.findOne({ _id: req.query.deck, user: req.user._id }).select('title').lean()
    if (!deck) throw new HttpError(404, 'Deck not found')
    filter.deck = deck._id
  }

  const [cards, total] = await Promise.all([
    Card.find(filter).sort({ dueDate: 1 }).limit(SESSION_SIZE).lean(),
    Card.countDocuments(filter),
  ])
  res.json({ deck, total, cards: cards.map(withPreview) })
}

// POST /api/review/:cardId  { rating: again | hard | good | easy }
export async function reviewCard(req, res) {
  const card = await Card.findOne({ _id: req.params.cardId, user: req.user._id })
  if (!card) throw new HttpError(404, 'Card not found')

  Object.assign(card, schedule(card, req.body.rating))
  await Promise.all([
    card.save(),
    ReviewLog.create({ user: req.user._id, card: card._id, rating: req.body.rating }),
  ])

  res.json({ card: { _id: card._id, interval: card.interval, dueDate: card.dueDate } })
}

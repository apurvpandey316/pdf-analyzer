import Card from '../models/Card.js'
import Deck from '../models/Deck.js'
import HttpError from '../utils/httpError.js'

async function findOwnCard(req) {
  const card = await Card.findOne({ _id: req.params.id, user: req.user._id })
  if (!card) throw new HttpError(404, 'Card not found')
  return card
}

// PATCH /api/cards/:id  { front?, back? }
export async function updateCard(req, res) {
  const card = await findOwnCard(req)
  Object.assign(card, req.body)
  await card.save()
  res.json({ card })
}

// DELETE /api/cards/:id
export async function deleteCard(req, res) {
  const card = await findOwnCard(req)
  await card.deleteOne()
  await Deck.updateOne({ _id: card.deck }, { $inc: { cardCount: -1 } })
  res.json({ ok: true })
}

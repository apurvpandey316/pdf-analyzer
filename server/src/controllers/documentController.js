import { DEFAULT_MODEL, MODELS } from '../config/models.js'
import Card from '../models/Card.js'
import Deck from '../models/Deck.js'
import Document from '../models/Document.js'
import Quiz from '../models/Quiz.js'
import { generateStudySet } from '../services/ai.js'
import { refundCredits, spendCredits } from '../services/credits.js'
import { extractText } from '../services/pdf.js'
import HttpError from '../utils/httpError.js'

// POST /api/documents  (multipart: file, model?, title?)
// PDF -> text -> charge credits -> AI -> save deck, cards and quiz.
export async function createFromPdf(req, res) {
  if (!req.file) throw new HttpError(400, 'Please choose a PDF file')

  const modelKey = req.body.model || DEFAULT_MODEL
  const modelConfig = MODELS[modelKey]
  if (!modelConfig) throw new HttpError(400, 'Unknown model')

  // Read the PDF before charging, so a bad file never costs credits.
  const { text, pageCount } = await extractText(req.file.buffer)
  const fileName = req.file.originalname
  const customTitle = req.body.title?.trim().slice(0, 120)

  await spendCredits(req.user._id, modelConfig.credits, `Generated deck from "${fileName}"`)

  const doc = await Document.create({
    user: req.user._id,
    title: customTitle || fileName.replace(/\.pdf$/i, ''),
    fileName,
    pageCount,
    text,
  })

  let studySet
  try {
    studySet = await generateStudySet(text, modelConfig)
  } catch (err) {
    console.error('[ai] Generation failed:', err.message)
    await refundCredits(req.user._id, modelConfig.credits, `Refund: generation failed for "${fileName}"`)
    doc.status = 'failed'
    doc.error = err.message
    await doc.save()
    throw new HttpError(502, 'The AI could not generate flashcards right now. Your credits were refunded - please try again.')
  }

  const deck = await Deck.create({
    user: req.user._id,
    document: doc._id,
    title: customTitle || studySet.title,
    model: modelConfig.model,
    cardCount: studySet.cards.length,
  })
  await Card.insertMany(
    studySet.cards.map((c) => ({ user: req.user._id, deck: deck._id, front: c.front, back: c.back })),
  )
  await Quiz.create({ user: req.user._id, deck: deck._id, questions: studySet.quiz })

  doc.status = 'ready'
  await doc.save()

  res.status(201).json({ deck })
}

import mongoose from 'mongoose'

// A set of flashcards generated from one document.
const deckSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    title: { type: String, required: true, trim: true },
    model: { type: String, required: true }, // AI model used to generate it
    cardCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Deck', deckSchema)

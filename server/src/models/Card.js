import mongoose from 'mongoose'

const cardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },

    // SM-2 spaced repetition state
    repetitions: { type: Number, default: 0 }, // successful reviews in a row
    interval: { type: Number, default: 0 }, // days until next review
    easeFactor: { type: Number, default: 2.5 },
    dueDate: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true },
)

// Fast lookup of "cards due today" for a user.
cardSchema.index({ user: 1, dueDate: 1 })

export default mongoose.model('Card', cardSchema)

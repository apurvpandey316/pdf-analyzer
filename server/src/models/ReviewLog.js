import mongoose from 'mongoose'

// One row per flashcard review. Used for the study streak and daily stats.
const reviewLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  rating: { type: String, enum: ['again', 'hard', 'good', 'easy'], required: true },
  reviewedAt: { type: Date, default: Date.now },
})

reviewLogSchema.index({ user: 1, reviewedAt: -1 })

export default mongoose.model('ReviewLog', reviewLogSchema)

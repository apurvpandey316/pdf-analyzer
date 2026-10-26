import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answerIndex: { type: Number, required: true },
    explanation: { type: String },
  },
  { _id: false },
)

const attemptSchema = new mongoose.Schema(
  {
    answers: { type: [Number], required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
)

// Multiple-choice quiz generated alongside a deck. Graded in code, no AI cost.
const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    questions: { type: [questionSchema], default: [] },
    attempts: { type: [attemptSchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Quiz', quizSchema)

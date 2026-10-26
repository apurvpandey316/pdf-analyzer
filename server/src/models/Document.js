import mongoose from 'mongoose'

// An uploaded PDF. Only the extracted text is stored, not the file itself.
const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    pageCount: { type: Number, default: 0 },
    text: { type: String, required: true, select: false },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    error: { type: String },
  },
  { timestamps: true },
)

export default mongoose.model('Document', documentSchema)

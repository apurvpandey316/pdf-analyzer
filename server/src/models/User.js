import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false keeps the hash out of query results unless explicitly requested.
    passwordHash: { type: String, required: true, select: false },
    credits: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

// Shape sent to the client - never includes the password hash.
userSchema.methods.toPublic = function () {
  return { id: this._id, name: this.name, email: this.email, credits: this.credits }
}

export default mongoose.model('User', userSchema)

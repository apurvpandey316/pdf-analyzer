import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { createFromPdf } from '../controllers/documentController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { MAX_FILE_MB } from '../services/pdf.js'
import HttpError from '../utils/httpError.js'

const router = Router()

// Keep uploads in memory only - the PDF is parsed and then discarded.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new HttpError(400, 'Only PDF files are allowed'))
  },
})

// Per-user limit on AI generations (protects the free-tier quota and your API bill).
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user._id.toString(),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You have generated a lot of decks this hour. Please try again later.' },
})

// Text fields sent alongside the file in the multipart form.
const uploadFieldsSchema = z.object({
  model: z.enum(Object.keys(MODELS), 'Unknown model').optional(),
  title: z.string().trim().max(120, 'Title is too long').optional(),
})

router.post(
  '/',
  requireAuth,
  generateLimiter,
  upload.single('file'),
  validate(uploadFieldsSchema),
  createFromPdf,
)

export default router

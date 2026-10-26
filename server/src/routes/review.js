import { Router } from 'express'
import { z } from 'zod'
import { getDueCards, reviewCard } from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { RATINGS } from '../services/srs.js'

const router = Router()

const reviewSchema = z.object({
  rating: z.enum(RATINGS, 'Rating must be again, hard, good or easy'),
})

router.use(requireAuth)
router.get('/', getDueCards)
router.post('/:cardId', validate(reviewSchema), reviewCard)

export default router

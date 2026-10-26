import { Router } from 'express'
import { z } from 'zod'
import { deleteDeck, getDeck, listDecks } from '../controllers/deckController.js'
import { getQuiz, submitQuiz } from '../controllers/quizController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const attemptSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3).nullable()).max(50),
})

router.use(requireAuth)
router.get('/', listDecks)
router.get('/:id', getDeck)
router.delete('/:id', deleteDeck)
router.get('/:id/quiz', getQuiz)
router.post('/:id/quiz/attempts', validate(attemptSchema), submitQuiz)

export default router

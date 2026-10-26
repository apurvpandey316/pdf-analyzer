import { Router } from 'express'
import { z } from 'zod'
import { deleteCard, updateCard } from '../controllers/cardController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const updateSchema = z
  .object({
    front: z.string().trim().min(1, 'Front cannot be empty').max(500, 'Front is too long'),
    back: z.string().trim().min(1, 'Back cannot be empty').max(1500, 'Back is too long'),
  })
  .partial()

router.use(requireAuth)
router.patch('/:id', validate(updateSchema), updateCard)
router.delete('/:id', deleteCard)

export default router

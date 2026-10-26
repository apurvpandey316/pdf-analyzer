import { Router } from 'express'
import { getStats } from '../controllers/statsController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, getStats)

export default router

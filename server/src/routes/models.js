import { Router } from 'express'
import { publicModels } from '../config/models.js'

const router = Router()

// GET /api/models - models the user can pick and their credit cost
router.get('/', (req, res) => {
  res.json({ models: publicModels() })
})

export default router

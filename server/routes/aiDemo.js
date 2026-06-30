import { Router } from 'express'
import { chooseDemoDirection } from '../services/aiService.js'
import { aiDemoRateLimiter } from '../middleware/rateLimiter.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { demoMoveSchema, validateBody } from '../schemas/index.js'

const router = Router()
router.use(aiDemoRateLimiter)

/**
 * POST /ai/demo-move
 */
router.post('/demo-move', validateBody(demoMoveSchema), asyncHandler(async (req, res) => {
  const { head, fruit, snake, cols, rows, direction } = req.body
  const nextDirection = await chooseDemoDirection({ head, fruit, snake, cols, rows, direction })
  res.json({ direction: nextDirection })
}))

export default router
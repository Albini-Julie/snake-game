import { Router } from 'express'
import { generateUsernames, getCachedUsernames, generateAdvice } from '../services/aiService.js'
import { aiRateLimiter } from '../middleware/rateLimiter.js'
import { asyncHandler, httpError } from '../middleware/errorHandler.js'
import { adviceSchema, validateBody } from '../schemas/index.js'
import logger from '../config/logger.js'

const router = Router()
router.use(aiRateLimiter)

/**
 * GET /ai/usernames
 */
router.get('/usernames', asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true'

  try {
    const usernames = await generateUsernames({ forceRefresh })
    res.json({ usernames })
  } catch (err) {
    logger.warn({ err }, 'Erreur génération pseudos, tentative de fallback sur le cache')
    const cached = getCachedUsernames()
    if (cached) return res.json({ usernames: cached })
    throw httpError(500, 'Erreur lors de la génération des pseudos')
  }
}))

/**
 * POST /ai/advice
 */
router.post('/advice', validateBody(adviceSchema), asyncHandler(async (req, res) => {
  const { score, duration, level } = req.body
  const advice = await generateAdvice({ score, durationMs: duration, level })
  res.json({ advice })
}))

export default router
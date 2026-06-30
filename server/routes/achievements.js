import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getAllAchievements, getUserAchievements } from '../services/achievementService.js'

const router = Router()

/**
 * GET /achievements
 */
router.get('/', asyncHandler(async (req, res) => {
  const data = await getAllAchievements()
  res.json(data)
}))

/**
 * GET /achievements/me
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const data = await getUserAchievements(req.user.id)
  res.json(data)
}))

export default router
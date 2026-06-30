import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { getAllAchievements, getUserAchievements } from '../services/achievementService.js'

const router = Router()

/**
 * GET /achievements
 * Tous les badges disponibles
 */
router.get('/', async (req, res) => {
  try {
    const data = await getAllAchievements()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /achievements/me
 * Badges débloqués par le joueur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const data = await getUserAchievements(req.user.id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
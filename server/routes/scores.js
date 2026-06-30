import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { checkAchievements } from '../services/achievementService.js'
import {
  isScoreCoherent,
  isFirstGame,
  createScore,
  getLeaderboard,
  getUserScores,
  getUserStats,
} from '../services/scoreService.js'

const router = Router()

/**
 * POST /scores
 * Enregistre un score en fin de partie
 */
router.post('/', authMiddleware, async (req, res) => {
  const { score, duration, level } = req.body

  if (score === undefined || duration === undefined) {
    return res.status(400).json({ error: 'score et duration sont requis' })
  }
  if (typeof score !== 'number' || typeof duration !== 'number') {
    return res.status(400).json({ error: 'score et duration doivent être des nombres' })
  }
  if (score < 0 || duration <= 0) {
    return res.status(400).json({ error: 'Valeurs invalides' })
  }
  if (!isScoreCoherent(score, duration)) {
    return res.status(400).json({ error: 'Score incohérent avec la durée de partie' })
  }

  try {
    const firstGame = await isFirstGame(req.user.id)
    const data       = await createScore({ userId: req.user.id, value: score, durationMs: duration })

    const newAchievements = await checkAchievements({
      userId:      req.user.id,
      score,
      duration,
      level:       level ?? 1,
      isFirstGame: firstGame,
    })

    res.status(201).json({ ...data, newAchievements })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /scores/leaderboard
 * Top 10 toutes sessions confondues
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const data = await getLeaderboard()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /scores/stats
 * Stats agrégées du joueur connecté
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await getUserStats(req.user.id)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /scores/me
 * Historique des scores du joueur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const data = await getUserScores(req.user.id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
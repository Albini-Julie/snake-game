import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { asyncHandler, httpError } from '../middleware/errorHandler.js'
import { createScoreSchema, validateBody } from '../schemas/index.js'
import { checkAchievements } from '../services/achievementService.js'
import {
  isScoreCoherent,
  isFirstGame,
  createScore,
  getLeaderboard,
  getUserScores,
  getUserStats,
  getWorldRecordReplay,
} from '../services/scoreService.js'

const router = Router()

/**
 * POST /scores
 * Enregistre un score en fin de partie
 */
router.post('/', authMiddleware, validateBody(createScoreSchema), asyncHandler(async (req, res) => {
  const { score, duration, level, seed, inputs } = req.body

  if (!isScoreCoherent(score, duration)) {
    throw httpError(400, 'Score incohérent avec la durée de partie')
  }

  const firstGame = await isFirstGame(req.user.id)
  const { score: data, isWorldRecord } = await createScore({
    userId:    req.user.id,
    value:     score,
    durationMs: duration,
    seed,
    inputs,
  })

  const newAchievements = await checkAchievements({
    userId:      req.user.id,
    score,
    duration,
    level:       level ?? 1,
    isFirstGame: firstGame,
  })

  res.status(201).json({ ...data, newAchievements, isWorldRecord })
}))

/**
 * GET /scores/leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const data = await getLeaderboard()
  res.json(data)
}))

/**
 * GET /scores/replay
 * Retourne les données du replay du record mondial
 */
router.get('/replay', asyncHandler(async (req, res) => {
  const data = await getWorldRecordReplay()
  if (!data) throw httpError(404, 'Aucun replay disponible')
  res.json(data)
}))

/**
 * GET /scores/stats
 */
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const stats = await getUserStats(req.user.id)
  res.json(stats)
}))

/**
 * GET /scores/me
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const data = await getUserScores(req.user.id)
  res.json(data)
}))

export default router
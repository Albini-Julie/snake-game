import { Router } from 'express'
import supabase from '../config/supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

/**
 * GET /achievements
 * Retourne tous les badges disponibles
 */
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('name')

  if (error) return res.status(500).json({ error: 'Erreur lors de la récupération des badges' })
  res.json(data)
})

/**
 * GET /achievements/me
 * Retourne les badges débloqués par le joueur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      unlocked_at,
      achievements ( id, slug, name, description, color )
    `)
    .eq('user_id', req.user.id)
    .order('unlocked_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Erreur lors de la récupération des badges' })
  res.json(data)
})

/**
 * Fonction utilitaire — débloque un badge si pas déjà obtenu
 */
export async function unlockAchievement(userId, slug) {
  // Récupère l'id du badge
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!achievement) return

  // Insert en ignorant si déjà existant (UNIQUE constraint)
  await supabase
    .from('user_achievements')
    .upsert({ user_id: userId, achievement_id: achievement.id }, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
}

/**
 * Vérifie et débloque les badges après une partie solo
 * { score, duration (ms), level, userId, isFirstGame }
 */
export async function checkAchievements({ userId, score, duration, level, isFirstGame }) {
  const durationSec = Math.round(duration / 1000)
  const toUnlock    = []

  if (isFirstGame)       toUnlock.push('first_game')
  if (score >= 1)        toUnlock.push('first_catch')
  if (score >= 5)        toUnlock.push('fish_hunter')
  if (score >= 10)       toUnlock.push('squid_level')
  if (score >= 20)       toUnlock.push('octopus_king')
  if (durationSec >= 30) toUnlock.push('survivor')
  if (durationSec >= 60) toUnlock.push('veteran')
  if (durationSec >= 120)toUnlock.push('legend')
  if (level >= 3)        toUnlock.push('on_fire')
  if (level >= 5)        toUnlock.push('speed_demon')

  await Promise.all(toUnlock.map(slug => unlockAchievement(userId, slug)))
  return toUnlock
}

/**
 * Vérifie et débloque les badges multijoueur
 */
export async function checkMultiplayerAchievements({ userId, isWinner }) {
  const toUnlock = ['social']
  if (isWinner) toUnlock.push('winner')
  await Promise.all(toUnlock.map(slug => unlockAchievement(userId, slug)))
  return toUnlock
}

export default router
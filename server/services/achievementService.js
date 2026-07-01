import supabase from '../config/supabase.js'

/**
 * Retourne tous les badges disponibles
 * @returns {Promise<object[]>}
 */
export async function getAllAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('name')

  if (error) throw new Error('Erreur lors de la récupération des badges')
  return data
}

/**
 * Retourne les badges débloqués par un joueur
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<object[]>}
 */
export async function getUserAchievements(userId) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      unlocked_at,
      achievements ( id, slug, name, description, color )
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) throw new Error('Erreur lors de la récupération des badges')
  return data
}

/**
 * Débloque un badge pour un joueur si pas déjà obtenu (idempotent)
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} slug - Identifiant du badge
 * @returns {Promise<void>}
 */
async function unlockAchievement(userId, slug) {
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!achievement) return

  await supabase
    .from('user_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievement.id },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
}

/**
 * Vérifie et débloque les badges après une partie solo
 * @param {{ userId: string, score: number, duration: number, level: number, isFirstGame: boolean }} params
 * @returns {Promise<string[]>} Liste des slugs débloqués
 */
export async function checkAchievements({ userId, score, duration, level, isFirstGame }) {
  const durationSec = Math.round(duration / 1000)
  const toUnlock     = []

  if (isFirstGame)         toUnlock.push('first_game')
  if (score >= 1)          toUnlock.push('first_catch')
  if (score >= 5)          toUnlock.push('fish_hunter')
  if (score >= 10)         toUnlock.push('squid_level')
  if (score >= 20)         toUnlock.push('octopus_king')
  if (durationSec >= 30)   toUnlock.push('survivor')
  if (durationSec >= 60)   toUnlock.push('veteran')
  if (durationSec >= 120)  toUnlock.push('legend')
  if (level >= 3)          toUnlock.push('on_fire')
  if (level >= 5)          toUnlock.push('speed_demon')

  await Promise.all(toUnlock.map(slug => unlockAchievement(userId, slug)))
  return toUnlock
}

/**
 * Vérifie et débloque les badges multijoueur
 * @param {{ userId: string, isWinner: boolean }} params
 * @returns {Promise<string[]>} Liste des slugs débloqués
 */
export async function checkMultiplayerAchievements({ userId, isWinner }) {
  const toUnlock = ['social']
  if (isWinner) toUnlock.push('winner')

  await Promise.all(toUnlock.map(slug => unlockAchievement(userId, slug)))
  return toUnlock
}
import supabase from '../config/supabase.js'

/**
 * Retourne tous les badges disponibles
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
 * Règles de déblocage des badges solo
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
 * Règles de déblocage des badges multijoueur
 */
export async function checkMultiplayerAchievements({ userId, isWinner }) {
  const toUnlock = ['social']
  if (isWinner) toUnlock.push('winner')

  await Promise.all(toUnlock.map(slug => unlockAchievement(userId, slug)))
  return toUnlock
}
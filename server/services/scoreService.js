import supabase from '../config/supabase.js'

const MAX_SCORE_PER_SECOND = 2

/**
 * Vérifie qu'un score est cohérent avec la durée de la partie (anti-triche)
 */
export function isScoreCoherent(score, durationMs) {
  const maxTheorique = Math.ceil((durationMs / 1000) * MAX_SCORE_PER_SECOND)
  return score <= maxTheorique
}

/**
 * Vérifie si c'est la première partie d'un joueur
 */
export async function isFirstGame(userId) {
  const { count } = await supabase
    .from('scores')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count === 0
}

/**
 * Enregistre un score en base
 */
export async function createScore({ userId, value, durationMs }) {
  const { data, error } = await supabase
    .from('scores')
    .insert({
      value,
      duration: Math.round(durationMs / 1000),
      user_id:  userId,
    })
    .select()
    .single()

  if (error) throw new Error('Erreur lors de la sauvegarde du score')
  return data
}

/**
 * Retourne le top 10 du leaderboard
 */
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id, value, duration, registration_date,
      users ( username, avatar_id, avatars ( path, name ) )
    `)
    .order('value', { ascending: false })
    .limit(10)

  if (error) throw new Error('Erreur lors de la récupération du leaderboard')
  return data
}

/**
 * Retourne l'historique des scores d'un joueur (10 plus récents par valeur)
 */
export async function getUserScores(userId) {
  const { data, error } = await supabase
    .from('scores')
    .select('id, value, duration, registration_date')
    .eq('user_id', userId)
    .order('value', { ascending: false })
    .limit(10)

  if (error) throw new Error('Erreur lors de la récupération des scores')
  return data
}

/**
 * Calcule les statistiques agrégées d'un joueur
 */
export async function getUserStats(userId) {
  const { data, error } = await supabase
    .from('scores')
    .select('value, duration')
    .eq('user_id', userId)

  if (error) throw new Error('Erreur lors de la récupération des stats')

  if (data.length === 0) {
    return { played: 0, best: 0, average: 0, totalDuration: 0 }
  }

  const played        = data.length
  const best          = Math.max(...data.map(s => s.value))
  const average        = Math.round(data.reduce((sum, s) => sum + s.value, 0) / played)
  const totalDuration  = data.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  return { played, best, average, totalDuration }
}
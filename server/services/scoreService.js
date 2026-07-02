import supabase from '../config/supabase.js'

const MAX_SCORE_PER_SECOND = Number(process.env.MAX_SCORE_PER_SECOND ?? 2)

/**
 * Vérifie qu'un score est cohérent avec la durée de la partie (anti-triche)
 * @param {number} score - Score à valider
 * @param {number} durationMs - Durée de la partie en millisecondes
 * @returns {boolean}
 */
export function isScoreCoherent(score, durationMs) {
  const maxTheorique = Math.ceil((durationMs / 1000) * MAX_SCORE_PER_SECOND)
  return score <= maxTheorique
}

/**
 * Vérifie si c'est la première partie d'un joueur
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<boolean>}
 */
export async function isFirstGame(userId) {
  const { count } = await supabase
    .from('scores')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count === 0
}

/**
 * Retourne le meilleur score global toutes parties confondues
 * @returns {Promise<number>}
 */
export async function getWorldRecord() {
  const { data, error } = await supabase
    .from('scores')
    .select('value')
    .order('value', { ascending: false })
    .limit(1)
    .single()

  if (error) return 0
  return data?.value ?? 0
}

/**
 * Enregistre un score en base.
 * Si le score est un nouveau record mondial, sauvegarde aussi seed et inputs pour le replay.
 * @param {{ userId: string, value: number, durationMs: number, seed?: number, inputs?: Array }} params
 * @returns {Promise<{ score: object, isWorldRecord: boolean }>}
 */
export async function createScore({ userId, value, durationMs, seed, inputs }) {
  const worldRecord = await getWorldRecord()
  const isWorldRecord = value > worldRecord
  

  const { data, error } = await supabase
    .from('scores')
    .insert({
      value,
      duration: Math.round(durationMs / 1000),
      user_id:  userId,
      // Sauvegarde seed et inputs uniquement si c'est un nouveau record mondial
      seed:     isWorldRecord ? seed   : null,
      inputs:   isWorldRecord ? inputs : null,
    })
    .select()
    .single()

  if (error) throw new Error('Erreur lors de la sauvegarde du score')
  return { score: data, isWorldRecord }
}

/**
 * Retourne le score record mondial avec ses données de replay
 * @returns {Promise<object|null>}
 */
export async function getWorldRecordReplay() {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id, value, duration, seed, inputs,
      users ( username, avatars ( path, name ) )
    `)
    .not('seed', 'is', null)
    .order('value', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

/**
 * Retourne le top 10 du leaderboard global
 * @returns {Promise<object[]>}
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
 * Retourne les 10 meilleurs scores d'un joueur
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<object[]>}
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
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<{ played: number, best: number, average: number, totalDuration: number }>}
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

  const played       = data.length
  const best         = Math.max(...data.map(s => s.value))
  const average      = Math.round(data.reduce((sum, s) => sum + s.value, 0) / played)
  const totalDuration = data.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  return { played, best, average, totalDuration }
}
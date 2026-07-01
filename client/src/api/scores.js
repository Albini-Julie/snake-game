import api from '@/lib/api'

/**
 * Enregistre un score en fin de partie
 */
export function saveScore({ score, duration, level }) {
  return api.post('/scores', { score, duration, level })
}

/**
 * Récupère le top 10 du leaderboard
 */
export function getLeaderboard() {
  return api.get('/scores/leaderboard')
}

/**
 * Récupère les statistiques agrégées du joueur connecté
 */
export function getMyStats() {
  return api.get('/scores/stats')
}

/**
 * Récupère l'historique des scores du joueur connecté
 */
export function getMyScores() {
  return api.get('/scores/me')
}
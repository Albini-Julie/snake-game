import api from '@/lib/api'

/**
 * Récupère tous les badges disponibles
 */
export function getAllAchievements() {
  return api.get('/achievements')
}

/**
 * Récupère les badges débloqués par le joueur connecté
 */
export function getMyAchievements() {
  return api.get('/achievements/me')
}
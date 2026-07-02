import api from '@/lib/api'
import { getCached, setCached } from '@/api/cache'

/**
 * Récupère tous les badges disponibles (avec cache en mémoire)
 */
export async function getAllAchievements() {
  const cached = getCached('achievements')
  if (cached) return { data: cached }

  const result = await api.get('/achievements')
  setCached('achievements', result.data)
  return result
}

/**
 * Récupère les badges débloqués par le joueur connecté
 */
export function getMyAchievements() {
  return api.get('/achievements/me')
}
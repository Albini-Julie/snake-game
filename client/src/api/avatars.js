import api from '@/lib/api'

/**
 * Récupère tous les avatars disponibles
 */
export function getAvatars() {
  return api.get('/avatars')
}
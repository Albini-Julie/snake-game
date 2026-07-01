import api from '@/lib/api'

/**
 * Récupère le profil de l'utilisateur connecté
 */
export function getMyProfile() {
  return api.get('/users/me')
}

/**
 * Met à jour l'avatar de l'utilisateur connecté
 */
export function updateAvatar(avatarId) {
  return api.put('/users/avatar', { avatar_id: avatarId })
}
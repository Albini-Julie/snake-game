import api from '@/lib/api'

/**
 * Génère 3 pseudos marins via IA
 */
export function getUsernameSuggestions({ refresh = false } = {}) {
  return api.get(`/ai/usernames${refresh ? '?refresh=true' : ''}`)
}

/**
 * Génère un conseil de gameplay personnalisé après une partie
 */
export function getGameAdvice({ score, duration, level }) {
  return api.post('/ai/advice', { score, duration, level })
}

/**
 * Demande à l'IA la prochaine direction en mode démo
 */
export function getDemoMove({ head, fruit, snake, cols, rows, direction }) {
  return api.post('/ai/demo-move', { head, fruit, snake, cols, rows, direction })
}
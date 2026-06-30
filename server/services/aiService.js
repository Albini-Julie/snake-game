const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

// ── Cache pseudos ────────────────────────────────────────────────────────────
let usernamesCache = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Appel générique à l'API Mistral
 */
async function callMistral(prompt, maxTokens = 300) {
  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model:       'mistral-small-latest',
      max_tokens:  maxTokens,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message ?? 'Erreur Mistral')

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

/**
 * Nettoie le markdown éventuel renvoyé par le modèle
 */
function stripMarkdown(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .trim()
}

/**
 * Génère 3 pseudos marins, avec cache de 5 minutes
 */
export async function generateUsernames({ forceRefresh = false } = {}) {
  if (!forceRefresh && usernamesCache.data && Date.now() - usernamesCache.timestamp < CACHE_TTL) {
    return usernamesCache.data
  }

  const text = await callMistral(
    `Génère exactement 3 pseudos courts pour un jeu de poulpe marin.
Règles strictes : sans espace, max 12 caractères chacun, séparés par des virgules, rien d'autre.
Format exact : Pseudo1,Pseudo2,Pseudo3`
  )

  const usernames = text.split(',').map(u => u.trim()).filter(Boolean).slice(0, 3)

  if (usernames.length === 0) throw new Error('Impossible de générer des pseudos')

  usernamesCache = { data: usernames, timestamp: Date.now() }
  return usernames
}

/**
 * Retourne le cache de pseudos même expiré (fallback en cas d'erreur Mistral)
 */
export function getCachedUsernames() {
  return usernamesCache.data
}

/**
 * Génère un conseil de gameplay personnalisé
 */
export async function generateAdvice({ score, durationMs, level }) {
  const durationSec = Math.round(durationMs / 1000)

  const advice = await callMistral(
    `Tu es un coach de jeu snake. Un joueur vient de terminer une partie :
- Score : ${score} poissons mangés
- Durée : ${durationSec} secondes
- Niveau atteint : ${level}/5

Donne UN conseil technique précis et actionnable sur COMMENT mieux jouer.
Exemples de bons conseils :
- "Longe les bords pour garder de la place au centre"
- "Anticipe ta trajectoire 3 cases à l'avance pour éviter de te coincer"
- "Mange les poissons qui sont loin des murs en premier"

Règles strictes :
- 1 seule phrase max
- Pas de félicitations
- Pas de métaphores marines
- Uniquement un conseil de gameplay concret
- Commence directement par le conseil`
  )

  if (!advice) throw new Error('Impossible de générer un conseil')
  return stripMarkdown(advice)
}

// ── Logique du mode démo (pathfinding + IA) ──────────────────────────────────

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
const ALL_DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT']

/**
 * Calcule les directions sûres (hors mur, hors corps) depuis la tête du snake
 */
export function getSafeDirections({ head, snake, cols, rows, direction }) {
  const possible = ALL_DIRS.filter(d => d !== OPPOSITE[direction])
  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`))

  const moves = {
    UP:    { x: head.x,     y: head.y - 1 },
    DOWN:  { x: head.x,     y: head.y + 1 },
    LEFT:  { x: head.x - 1, y: head.y     },
    RIGHT: { x: head.x + 1, y: head.y     },
  }

  const safe = possible.filter(d => {
    const m = moves[d]
    return m.x >= 0 && m.x < cols && m.y >= 0 && m.y < rows && !snakeSet.has(`${m.x},${m.y}`)
  })

  return { safe, moves }
}

/**
 * Direction de secours : la plus proche du fruit parmi les directions sûres
 */
export function getFallbackDirection({ safe, moves, fruit }) {
  return safe.reduce((best, d) => {
    const m    = moves[d]
    const dist = Math.abs(m.x - fruit.x) + Math.abs(m.y - fruit.y)
    return dist < best.dist ? { dir: d, dist } : best
  }, { dir: safe[0], dist: Infinity }).dir
}

/**
 * Demande à Mistral la meilleure direction parmi les directions sûres
 */
export async function chooseDemoDirection({ head, fruit, snake, cols, rows, direction }) {
  const { safe, moves } = getSafeDirections({ head, snake, cols, rows, direction })

  // Cas triviaux — pas besoin d'appeler l'IA
  if (safe.length === 1) return safe[0]
  if (safe.length === 0) return direction

  try {
    const prompt = `Tu joues au snake sur une grille de ${cols}x${rows} cases.
Position de la tête : (${head.x}, ${head.y})
Position du fruit : (${fruit.x}, ${fruit.y})
Corps du snake (cases occupées) : ${snake.slice(0, 10).map(s => `(${s.x},${s.y})`).join(' ')}
Direction actuelle : ${direction}
Directions sûres disponibles : ${safe.join(', ')}

Choisis la meilleure direction pour atteindre le fruit sans mourir.
Réponds UNIQUEMENT avec un seul mot parmi : ${safe.join(', ')}`

    const answer = (await callMistral(prompt, 10)).toUpperCase()
    return safe.includes(answer) ? answer : safe[0]

  } catch (err) {
    console.error('Erreur IA demo-move:', err)
    return getFallbackDirection({ safe, moves, fruit })
  }
}
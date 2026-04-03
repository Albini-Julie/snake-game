import { Router } from 'express'

const router = Router()
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

/**
 * POST /ai/demo-move
 * Demande à Mistral la prochaine direction du snake
 * Body : { head, fruit, snake, cols, rows, direction }
 */
router.post('/demo-move', async (req, res) => {
  const { head, fruit, snake, cols, rows, direction } = req.body

  if (!head || !fruit || !snake || !cols || !rows) {
    return res.status(400).json({ error: 'Paramètres manquants' })
  }

  // Calcule les directions possibles (exclut le demi-tour)
  const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  const allDirs  = ['UP', 'DOWN', 'LEFT', 'RIGHT']
  const possible = allDirs.filter(d => d !== opposite[direction])

  // Calcule les cases libres pour chaque direction
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

  // Si une seule direction sûre, pas besoin d'appeler l'IA
  if (safe.length === 1) {
    return res.json({ direction: safe[0] })
  }
  // Si aucune direction sûre, retourne la direction actuelle
  if (safe.length === 0) {
    return res.json({ direction })
  }

  try {
    const prompt = `Tu joues au snake sur une grille de ${cols}x${rows} cases.
Position de la tête : (${head.x}, ${head.y})
Position du fruit : (${fruit.x}, ${fruit.y})
Corps du snake (cases occupées) : ${snake.slice(0, 10).map(s => `(${s.x},${s.y})`).join(' ')}
Direction actuelle : ${direction}
Directions sûres disponibles : ${safe.join(', ')}

Choisis la meilleure direction pour atteindre le fruit sans mourir.
Réponds UNIQUEMENT avec un seul mot parmi : ${safe.join(', ')}`

    const response = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model:       'mistral-small-latest',
        max_tokens:  10,
        temperature: 0.1, // basse température pour des réponses cohérentes
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message ?? 'Erreur Mistral')
    }

    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase()

    // Vérifie que la direction retournée est valide et sûre
    const finalDir = safe.includes(answer) ? answer : safe[0]
    res.json({ direction: finalDir })

  } catch (err) {
    console.error('Erreur IA demo-move:', err)
    // Fallback : direction la plus proche du fruit parmi les directions sûres
    const fallback = safe.reduce((best, d) => {
      const m = moves[d]
      const dist = Math.abs(m.x - fruit.x) + Math.abs(m.y - fruit.y)
      return dist < best.dist ? { dir: d, dist } : best
    }, { dir: safe[0], dist: Infinity })
    res.json({ direction: fallback.dir })
  }
})

export default router
import { Router } from 'express'

const router = Router()

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

// ── Cache pour les usernames ──────────────────────────────────────────────────
let usernamesCache = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

  if (!response.ok) {
    throw new Error(data.message ?? 'Erreur Mistral')
  }

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

/**
 * GET /ai/usernames
 * Génère 3 pseudos marins via Gemini
 */
router.get('/usernames', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true'
  // Retourne le cache si encore valide
  if (!forceRefresh && usernamesCache.data && Date.now() - usernamesCache.timestamp < CACHE_TTL) {
    return res.json({ usernames: usernamesCache.data })
  }

  try {
    const text = await callMistral(
  `Génère exactement 3 pseudos courts pour un jeu de poulpe marin.
Règles strictes : sans espace, max 12 caractères chacun, séparés par des virgules, rien d'autre.
Format exact : Pseudo1,Pseudo2,Pseudo3`
)

    const usernames = text.split(',').map(u => u.trim()).filter(Boolean).slice(0, 3)

    if (usernames.length === 0) {
      return res.status(500).json({ error: 'Impossible de générer des pseudos' })
    }

    // Met en cache
    usernamesCache = { data: usernames, timestamp: Date.now() }

    res.json({ usernames })
  } catch (err) {
    console.error('Erreur IA usernames:', err)
    // Si erreur Gemini, retourne le cache même expiré plutôt que rien
    if (usernamesCache.data) {
      return res.json({ usernames: usernamesCache.data })
    }
    res.status(500).json({ error: 'Erreur lors de la génération des pseudos' })
  }
})

/**
 * POST /ai/advice
 * Génère un conseil personnalisé après une partie
 * Body : { score, duration, level }
 */
router.post('/advice', async (req, res) => {
  const { score, duration, level } = req.body

  if (score === undefined || duration === undefined) {
    return res.status(400).json({ error: 'score et duration sont requis' })
  }

  const durationSec = Math.round(duration / 1000)

  try {
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

    if (!advice) {
      return res.status(500).json({ error: 'Impossible de générer un conseil' })
    }

    const cleanAdvice = advice
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\_\_/g, '')
    .replace(/\_/g, '')
    .trim()

    res.json({ advice: cleanAdvice })
  } catch (err) {
    console.error('Erreur IA advice:', err)
    res.status(500).json({ error: 'Erreur lors de la génération du conseil' })
  }
})

export default router
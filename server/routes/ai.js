import { Router } from 'express'
import { generateUsernames, getCachedUsernames, generateAdvice } from '../services/aiService.js'

const router = Router()

/**
 * GET /ai/usernames
 * Génère 3 pseudos marins via Mistral
 */
router.get('/usernames', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true'

  try {
    const usernames = await generateUsernames({ forceRefresh })
    res.json({ usernames })
  } catch (err) {
    console.error('Erreur IA usernames:', err)
    const cached = getCachedUsernames()
    if (cached) return res.json({ usernames: cached })
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

  try {
    const advice = await generateAdvice({ score, durationMs: duration, level })
    res.json({ advice })
  } catch (err) {
    console.error('Erreur IA advice:', err)
    res.status(500).json({ error: 'Erreur lors de la génération du conseil' })
  }
})

export default router
import { Router } from 'express'
import { chooseDemoDirection } from '../services/aiService.js'

const router = Router()

/**
 * POST /ai/demo-move
 * Demande la prochaine direction du snake en mode démo IA
 * Body : { head, fruit, snake, cols, rows, direction }
 */
router.post('/demo-move', async (req, res) => {
  const { head, fruit, snake, cols, rows, direction } = req.body

  if (!head || !fruit || !snake || !cols || !rows) {
    return res.status(400).json({ error: 'Paramètres manquants' })
  }

  const nextDirection = await chooseDemoDirection({ head, fruit, snake, cols, rows, direction })
  res.json({ direction: nextDirection })
})

export default router
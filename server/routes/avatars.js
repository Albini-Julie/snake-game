import { Router } from 'express'
import { getAllAvatars } from '../services/avatarService.js'

const router = Router()

/**
 * GET /avatars
 * Tous les avatars disponibles (route publique)
 */
router.get('/', async (req, res) => {
  try {
    const data = await getAllAvatars()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
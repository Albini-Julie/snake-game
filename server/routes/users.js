import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { getUserProfile, avatarExists, updateUserAvatar } from '../services/userService.js'
import { isValidUUID } from '../utils/validators.js'

const router = Router()

/**
 * GET /users/me
 * Profil de l'utilisateur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * PUT /users/avatar
 * Met à jour l'avatar de l'utilisateur connecté
 */
router.put('/avatar', authMiddleware, async (req, res) => {
  const { avatar_id } = req.body

  if (!avatar_id) {
    return res.status(400).json({ error: 'avatar_id est requis' })
  }
  if (!isValidUUID(avatar_id)) {
    return res.status(400).json({ error: 'avatar_id doit être un UUID valide' })
  }

  const exists = await avatarExists(avatar_id)
  if (!exists) {
    return res.status(404).json({ error: 'Avatar introuvable' })
  }

  try {
    const data = await updateUserAvatar({
      userId:   req.user.id,
      avatarId: avatar_id,
      email:    req.user.email,
    })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
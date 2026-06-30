import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import { asyncHandler, httpError } from '../middleware/errorHandler.js'
import { updateAvatarSchema, validateBody } from '../schemas/index.js'
import { getUserProfile, avatarExists, updateUserAvatar } from '../services/userService.js'

const router = Router()

/**
 * GET /users/me
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const profile = await getUserProfile(req.user.id)
  res.json(profile)
}))

/**
 * PUT /users/avatar
 */
router.put('/avatar', authMiddleware, validateBody(updateAvatarSchema), asyncHandler(async (req, res) => {
  const { avatar_id } = req.body

  const exists = await avatarExists(avatar_id)
  if (!exists) {
    throw httpError(404, 'Avatar introuvable')
  }

  const data = await updateUserAvatar({
    userId:   req.user.id,
    avatarId: avatar_id,
    email:    req.user.email,
  })
  res.json(data)
}))

export default router
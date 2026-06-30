import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getAllAvatars } from '../services/avatarService.js'

const router = Router()

/**
 * GET /avatars
 */
router.get('/', asyncHandler(async (req, res) => {
  const data = await getAllAvatars()
  res.json(data)
}))

export default router
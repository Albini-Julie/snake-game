import { Router } from 'express'
import supabase from '../config/supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

 // Retourne le profil de l'utilisateur connecté avec son avatar
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      email,
      registration_date,
      avatar_id,
      avatars ( id, name, path )
    `)
    .eq('id', req.user.id)
    .single()

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil' })
  }

  res.json(data)
})

 // Met à jour l'avatar de l'utilisateur connecté
 // Body : { avatar_id: string (uuid) }
router.put('/avatar', authMiddleware, async (req, res) => {
  const { avatar_id } = req.body

  if (!avatar_id) {
    return res.status(400).json({ error: 'avatar_id est requis' })
  }

  // Vérifie que l'avatar existe
  const { data: avatar, error: avatarError } = await supabase
    .from('avatars')
    .select('id')
    .eq('id', avatar_id)
    .single()

  if (avatarError || !avatar) {
    return res.status(404).json({ error: 'Avatar introuvable' })
  }

  // Essaie d'abord un UPDATE simple
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', req.user.id)
    .single()

  let data, error

  if (existing) {
    // Le profil existe → simple UPDATE
    ;({ data, error } = await supabase
      .from('users')
      .update({ avatar_id })
      .eq('id', req.user.id)
      .select()
      .single())
  } else {
    // Le profil n'existe pas → INSERT avec toutes les infos
    ;({ data, error } = await supabase
      .from('users')
      .insert({
        id:       req.user.id,
        email:    req.user.email,
        username: req.user.user_metadata?.username ?? req.user.email.split('@')[0],
        avatar_id,
      })
      .select()
      .single())
  }

  if (error) {
    console.error('Erreur update avatar:', error)
    return res.status(500).json({ error: "Erreur lors de la mise à jour de l'avatar" })
  }

  res.json(data)
})

export default router
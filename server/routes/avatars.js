import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

 //Retourne tous les avatars disponibles
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('avatars')
    .select('id, name, path')
    .order('name')

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des avatars' })
  }

  res.json(data)
})

export default router
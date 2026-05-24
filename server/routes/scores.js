import { Router } from 'express'
import supabase from '../config/supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

// Score maximum théorique par seconde (anti-triche)
// Une grille 10x10 = 100 cellules max, 1 point par cellule mangée
const MAX_SCORE_PER_SECOND = 2

 // Enregistre un score en fin de partie
 // Body : { score: number, duration: number }
router.post('/', authMiddleware, async (req, res) => {
  const { score, duration } = req.body

  // Validation des champs
  if (score === undefined || duration === undefined) {
    return res.status(400).json({ error: 'score et duration sont requis' })
  }
  if (typeof score !== 'number' || typeof duration !== 'number') {
    return res.status(400).json({ error: 'score et duration doivent être des nombres' })
  }
  if (score < 0 || duration <= 0) {
    return res.status(400).json({ error: 'Valeurs invalides' })
  }

  // Validation anti-triche : score cohérent avec la durée
  const maxTheorique = Math.ceil((duration / 1000) * MAX_SCORE_PER_SECOND)
  if (score > maxTheorique) {
    return res.status(400).json({ error: 'Score incohérent avec la durée de partie' })
  }

  const { data, error } = await supabase
    .from('scores')
    .insert({
      value: score,
      duration: Math.round(duration / 1000), // stocké en secondes
      user_id: req.user.id,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde du score' })
  }

  res.status(201).json(data)
})

 // Retourne les 10 meilleurs scores toutes sessions confondues
router.get('/leaderboard', async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      value,
      duration,
      registration_date,
      users (
        username,
        avatar_id,
        avatars ( path, name )
      )
    `)
    .order('value', { ascending: false })
    .limit(10)

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du leaderboard' })
  }

  res.json(data)
})

 // Retourne l'historique des scores de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('id, value, duration, registration_date')
    .eq('user_id', req.user.id)
    .order('value', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des scores' })
  }

  res.json(data)
})

/**
 * GET /scores/stats
 * Retourne les stats du joueur connecté
 */
router.get('/stats', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('value, duration')
    .eq('user_id', req.user.id)
    .limit(10)

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des stats' })
  }

  if (data.length === 0) {
    return res.json({ played: 0, best: 0, average: 0, totalDuration: 0 })
  }

  const played        = data.length
  const best          = Math.max(...data.map(s => s.value))
  const average       = Math.round(data.reduce((sum, s) => sum + s.value, 0) / played)
  const totalDuration = data.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  res.json({ played, best, average, totalDuration })
})

export default router
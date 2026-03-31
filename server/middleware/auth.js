import supabase from '../config/supabase.js'

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' })
  }

  const token = authHeader.split(' ')[1]

  // Vérifie le token JWT auprès de Supabase
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token expiré ou invalide' })
  }

  // Attache l'utilisateur à la requête pour les routes suivantes
  req.user = data.user
  next()
}

export default authMiddleware
import logger from '../config/logger.js'

/**
 * Middleware d'erreur Express — DOIT être le dernier `app.use()` du fichier index.js.
 * Toute erreur passée via next(err) dans les routes/services atterrit ici,
 * garantissant un format de réponse JSON cohérent sur toute l'API.
 */
export function errorHandler(err, req, res, next) {
  const status  = err.status ?? 500
  const message = err.message ?? 'Erreur interne du serveur'

  // Log structuré : warn pour les erreurs client (4xx), error pour le reste
  if (status >= 500) {
    logger.error({ err, path: req.path, method: req.method }, message)
  } else {
    logger.warn({ path: req.path, method: req.method, status }, message)
  }

  res.status(status).json({ error: message })
}

/**
 * Wrapper pour éviter les try/catch répétés dans chaque route async.
 * Capture automatiquement les erreurs et les transmet à errorHandler.
 *
 * Usage : router.get('/', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Petite aide pour créer des erreurs avec un status HTTP explicite
 * Usage : throw httpError(404, 'Avatar introuvable')
 */
export function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}
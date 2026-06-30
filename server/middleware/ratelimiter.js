import rateLimit from 'express-rate-limit'

/**
 * Limite les appels aux routes IA pour protéger le quota Mistral.
 * 10 requêtes par minute par IP - largement suffisant pour un usage normal,
 * mais bloque le spam ou les boucles infinies côté client.
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true, // retourne les infos de quota dans les headers RateLimit-*
  legacyHeaders: false,
  message: { error: 'Trop de requêtes IA. Réessaie dans une minute.' },
})

/**
 * Limite spécifique pour le mode démo IA, plus permissive
 * car appelée automatiquement toutes les ~750ms pendant la démo.
 */
const aiDemoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // ~1 requête/seconde
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes en mode démo. Réessaie dans une minute.' },
})

export { aiRateLimiter, aiDemoRateLimiter }
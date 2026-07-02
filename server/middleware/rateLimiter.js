import rateLimit from 'express-rate-limit'

const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60 * 1000)
const max      = Number(process.env.AI_RATE_LIMIT_MAX ?? 10)
const demoMax  = Number(process.env.AI_DEMO_RATE_LIMIT_MAX ?? 60)

/**
 * Limite les appels aux routes IA pour protéger le quota Mistral.
 */
const aiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes IA. Réessaie dans une minute.' },
})

/**
 * Limite spécifique pour le mode démo IA, plus permissive.
 */
const aiDemoRateLimiter = rateLimit({
  windowMs,
  max: demoMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes en mode démo. Réessaie dans une minute.' },
})

export { aiRateLimiter, aiDemoRateLimiter }
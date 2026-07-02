import { z } from 'zod'

const uuidSchema = z.string().uuid()

// Scores
export const createScoreSchema = z.object({
  score:    z.number().int().min(0),
  duration: z.number().positive(),
  level:    z.number().int().min(1).max(5).optional(),
  seed:     z.number().int().optional(),
  inputs:   z.array(z.object({
    dir: z.enum(['UP', 'DOWN', 'LEFT', 'RIGHT']),
    t:   z.number().int().min(0),
  })).optional(),
})

// Users
export const updateAvatarSchema = z.object({
  avatar_id: uuidSchema,
})

//  IA
export const adviceSchema = z.object({
  score:    z.number().int().min(0),
  duration: z.number().positive(),
  level:    z.number().int().min(1).max(5).optional(),
})

const positionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
})

export const demoMoveSchema = z.object({
  head:      positionSchema,
  fruit:     positionSchema,
  snake:     z.array(positionSchema).min(1),
  cols:      z.number().int().positive(),
  rows:      z.number().int().positive(),
  direction: z.enum(['UP', 'DOWN', 'LEFT', 'RIGHT']),
})

/**
 * Middleware générique qui valide req.body contre un schéma Zod.
 * En cas d'échec, transmet une erreur 400 formatée à errorHandler via next().
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      const err = new Error(messages.join(', '))
      err.status = 400
      return next(err)
    }

    req.body = result.data
    next()
  }
}
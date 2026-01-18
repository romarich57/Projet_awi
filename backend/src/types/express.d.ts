import type { TokenPayload } from './token-payload.js'

// Role : Etendre le type Express.Request avec les champs auth.
declare global {
  namespace Express {
    // On ajoute user au type Request d'Express
    interface Request {
      cookies?: Record<string, string>
      user?: TokenPayload // Peut etre defini par verifyToken
    }
  }
}

export {}

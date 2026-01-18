import type { Response, NextFunction } from 'express'

// Role : Autoriser uniquement les administrateurs.
// Preconditions : req.user est renseigne par le middleware d'authentification.
// Postconditions : Passe au middleware suivant ou renvoie 403.
export function requireAdmin(req: Express.Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acces reserve aux administrateurs' })
  }
  next()
}

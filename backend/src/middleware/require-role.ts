import type { Response, NextFunction } from 'express'

// Role : Restreindre l'acces aux roles autorises.
// Preconditions : roles contient au moins un role valide.
// Postconditions : Retourne un middleware qui valide le role utilisateur.
export function requireRole(roles: string[]) {
  return (req: Express.Request, res: Response, next: NextFunction) => {
    const role = req.user?.role
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Acces interdit' })
    }
    next()
  }
}

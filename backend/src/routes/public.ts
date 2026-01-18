// Role : Exposer des routes publiques simples.
import { Router } from 'express'

const router = Router()

// Role : Retourner un message d'accueil public.
// Preconditions : Aucune.
// Postconditions : Repond avec un message JSON.
router.get('/', (_req, res) => {
  res.json({ message: 'Bienvenue sur l’API publique (accès libre)' })
})

export default router

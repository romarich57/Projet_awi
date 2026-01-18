// Role : Gérer les routes de mécanismes.
import { Router } from 'express'
import pool from '../db/database.js'

const router = Router()

// Role : Lister les mécanismes disponibles.
// Preconditions : La base est accessible.
// Postconditions : Retourne la liste des mécanismes ou une erreur.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description FROM mechanism ORDER BY name ASC',
    )
    res.json(rows)
  } catch (err) {
    console.error('Erreur lors de la récupération des mécanismes', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

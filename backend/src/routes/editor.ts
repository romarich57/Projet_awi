// Role : Gérer les routes des éditeurs.
import { Router } from 'express'
import pool from '../db/database.js'

const router = Router()

// Role : Lister les éditeurs.
// Preconditions : La base est accessible.
// Postconditions : Retourne la liste des éditeurs ou une erreur.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, website, description, logo_url, is_exhibitor, is_distributor
       FROM editor
       ORDER BY name ASC`,
    )
    res.json(rows)
  } catch (err) {
    console.error('Erreur lors de la récupération des éditeurs', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

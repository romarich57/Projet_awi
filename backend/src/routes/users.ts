import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

// Profil de l'utilisateur connecté
router.get('/me', async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, login, role FROM users WHERE id=$1',
      [user.id]
    )
    const profile = rows[0]
    if (!profile) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    res.json(profile)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Liste des utilisateurs (admin uniquement)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, login, role FROM users ORDER BY id'
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Création d'un utilisateur
router.post('/', async (req, res) => {
  const { login, password } = req.body
  if (!login || !password) {
    return res.status(400).json({ error: 'Login et mot de passe requis' })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO users (login, password_hash) VALUES ($1, $2)',
      [login, hash]
    )
    res.status(201).json({ message: 'Utilisateur créé' })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Login déjà existant' })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
})

// Récupère un utilisateur par identifiant (sans exposer le mot de passe)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, login, role FROM users WHERE id = $1',
      [id]
    )
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

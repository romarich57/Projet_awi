import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PublicUser = {
  id: number
  login: string
  role: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  emailVerified: boolean
  createdAt: Date
}

const SAFE_FIELDS = `
  id,
  login,
  role,
  first_name AS "firstName",
  last_name AS "lastName",
  email,
  phone,
  avatar_url AS "avatarUrl",
  email_verified AS "emailVerified",
  created_at AS "createdAt"
`

function sanitize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// Profil de l'utilisateur connecté
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' })
  }

  try {
    const { rows } = await pool.query<PublicUser>(
      `SELECT ${SAFE_FIELDS} FROM users WHERE id = $1 LIMIT 1`,
      [req.user.id],
    )
    const profile = rows[0]
    if (!profile) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    res.json(profile)
  } catch (err) {
    console.error('Erreur /users/me', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Liste des utilisateurs (admin uniquement)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query<PublicUser>(
      `SELECT ${SAFE_FIELDS} FROM users ORDER BY created_at DESC`,
    )
    res.json(rows)
  } catch (err) {
    console.error('Erreur liste utilisateurs', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Création d'un utilisateur (admin)
router.post('/', requireAdmin, async (req, res) => {
  const login = sanitize(req.body?.login)
  const password = sanitize(req.body?.password)
  const firstName = sanitize(req.body?.firstName)
  const lastName = sanitize(req.body?.lastName)
  const email = sanitize(req.body?.email).toLowerCase()
  const phone = sanitize(req.body?.phone)
  const avatarUrl = sanitize(req.body?.avatarUrl)

  if (!login || !password || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    const { rows: existing } = await pool.query<{ login: string; email: string | null }>(
      `
      SELECT login, email
      FROM users
      WHERE login = $1 OR LOWER(email) = LOWER($2)
      LIMIT 1
    `,
      [login, email],
    )

    const duplicate = existing[0]
    if (duplicate) {
      if (duplicate.login === login) {
        return res.status(409).json({ error: 'Login déjà utilisé' })
      }
      const existingEmail = duplicate.email?.toLowerCase()
      if (existingEmail && existingEmail === email) {
        return res.status(409).json({ error: 'Email déjà utilisé' })
      }
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      `
      INSERT INTO users (
        login,
        password_hash,
        role,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        email_verified,
        email_verification_token,
        email_verification_expires_at
      )
      VALUES ($1, $2, 'user', $3, $4, $5, $6, $7, TRUE, NULL, NULL)
    `,
      [login, hash, firstName, lastName, email, phone || null, avatarUrl || null],
    )

    res.status(201).json({ message: 'Utilisateur créé' })
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'Login ou email déjà existant' })
    } else {
      console.error('Erreur création utilisateur', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
})

// Récupère un utilisateur par identifiant (sans exposer le mot de passe)
router.get('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    const { rows } = await pool.query<PublicUser>(
      `SELECT ${SAFE_FIELDS} FROM users WHERE id = $1`,
      [id],
    )
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    res.json(user)
  } catch (err) {
    console.error('Erreur récupération utilisateur', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id])
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    res.json({ message: 'Utilisateur supprimé' })
  } catch (err) {
    console.error('Erreur suppression utilisateur', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

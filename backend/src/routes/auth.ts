import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/database.js'
import {
  verifyToken,
  createAccessToken,
  createRefreshToken,
} from '../middleware/token-management.js'
import { JWT_SECRET } from '../config/env.js'
import type { TokenPayload } from '../types/token-payload.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js'

type DbUser = {
  id: number
  login: string
  password_hash: string
  role: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  email_verified: boolean
  email_verification_token?: string | null
  email_verification_expires_at?: Date | null
  password_reset_token?: string | null
  password_reset_expires_at?: Date | null
  created_at: Date
}

type SafeUser = {
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000
const router = Router()

function toSafeUser(row: DbUser): SafeUser {
  return {
    id: row.id,
    login: row.login,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
  }
}

function sanitize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

router.post('/login', async (req, res) => {
  const identifier = sanitize(req.body?.identifier)
  const password = sanitize(req.body?.password)

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifiants manquants' })
  }

  try {
    const { rows } = await pool.query<DbUser>(
      `
      SELECT
        id,
        login,
        password_hash,
        role,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        email_verified,
        created_at
      FROM users
      WHERE login = $1 OR LOWER(email) = LOWER($2)
      LIMIT 1
    `,
      [identifier, identifier],
    )
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur inconnu' })
    }

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email non vérifié' })
    }

    const payload: TokenPayload = {
      id: user.id,
      login: user.login,
      role: user.role,
    }
    const accessToken = createAccessToken(payload)
    const refreshToken = createRefreshToken(payload)

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      message: 'Authentification réussie',
      user: toSafeUser(user),
    })
  } catch (error) {
    console.error('Erreur lors du login', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/register', async (req, res) => {
  const payload = {
    login: sanitize(req.body?.login),
    firstName: sanitize(req.body?.firstName),
    lastName: sanitize(req.body?.lastName),
    email: sanitize(req.body?.email).toLowerCase(),
    password: typeof req.body?.password === 'string' ? req.body.password : '',
    phone: sanitize(req.body?.phone),
    avatarUrl: sanitize(req.body?.avatarUrl),
  }

  if (
    !payload.login ||
    !payload.firstName ||
    !payload.lastName ||
    !payload.email ||
    payload.password.trim().length === 0
  ) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }

  if (!EMAIL_REGEX.test(payload.email)) {
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
      [payload.login, payload.email],
    )

    const duplicate = existing[0]
    if (duplicate) {
      if (duplicate.login === payload.login) {
        return res.status(409).json({ error: 'Login déjà utilisé' })
      }
      const existingEmail = duplicate.email?.toLowerCase()
      if (existingEmail && existingEmail === payload.email) {
        return res.status(409).json({ error: 'Email déjà utilisé' })
      }
    }

    const passwordHash = await bcrypt.hash(payload.password, 10)
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashVerificationToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
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
        ) VALUES (
          $1, $2, 'normal', $3, $4, $5, $6, $7, FALSE, $8, $9
        )
      `,
        [
          payload.login,
          passwordHash,
          payload.firstName,
          payload.lastName,
          payload.email,
          payload.phone || null,
          payload.avatarUrl || null,
          tokenHash,
          expiresAt,
        ],
      )

      await sendVerificationEmail(payload.email, token)
      await client.query('COMMIT')
    } catch (error: any) {
      await client.query('ROLLBACK')
      if (error?.code === '23505') {
        return res.status(409).json({ error: 'Login ou email déjà utilisé' })
      }
      console.error('Erreur lors de la création du compte', error)
      return res.status(500).json({ error: 'Erreur lors de la création du compte' })
    } finally {
      client.release()
    }

    res.status(201).json({
      message: 'Compte créé. Veuillez vérifier votre email pour activer votre compte.',
    })
  } catch (error) {
    console.error('Erreur validation inscription', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/resend-verification', async (req, res) => {
  const email = sanitize(req.body?.email).toLowerCase()
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    const { rows } = await pool.query<{ id: number; email_verified: boolean }>(
      `
      SELECT id, email_verified
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
      [email],
    )

    const user = rows[0]
    if (!user) {
      return res.json({
        message:
          'Si un compte non vérifié existe pour cet email, un lien vient d’être renvoyé.',
      })
    }

    if (user.email_verified) {
      return res.json({
        message: 'Ce compte est déjà vérifié. Vous pouvez vous connecter.',
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashVerificationToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pool.query(
      `
      UPDATE users
      SET email_verification_token = $1,
          email_verification_expires_at = $2
      WHERE id = $3
    `,
      [tokenHash, expiresAt, user.id],
    )

    await sendVerificationEmail(email, token)

    res.json({
      message: 'Un nouvel email de vérification vient d’être envoyé.',
    })
  } catch (error) {
    console.error('Erreur renvoi email vérification', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/verify-email', async (req, res) => {
  const token = sanitize(req.query?.token)
  if (!token) {
    return res.status(400).json({ error: 'Token manquant' })
  }

  const tokenHash = hashVerificationToken(token)

  try {
    const { rows } = await pool.query<DbUser>(
      `
      UPDATE users
      SET email_verified = TRUE,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
      WHERE email_verification_token = $1
        AND email_verification_expires_at > NOW()
      RETURNING
        id,
        login,
        password_hash,
        role,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        email_verified,
        created_at
    `,
      [tokenHash],
    )

    const user = rows[0]
    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' })
    }

    res.json({
      message: 'Votre email est vérifié, vous pouvez vous connecter.',
      user: toSafeUser(user),
    })
  } catch (error) {
    console.error('Erreur vérification email', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/password/forgot', async (req, res) => {
  const email = sanitize(req.body?.email).toLowerCase()
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    const { rows } = await pool.query<{ id: number }>(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
      [email],
    )

    const user = rows[0]
    if (!user) {
      return res.json({
        message:
          'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashVerificationToken(token)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS)

    await pool.query(
      `
      UPDATE users
      SET password_reset_token = $1,
          password_reset_expires_at = $2
      WHERE id = $3
    `,
      [tokenHash, expiresAt, user.id],
    )


    await sendPasswordResetEmail(email, token)

    res.json({
      message:
        'Si un compte existe pour cet email, un lien de réinitialisation vient d’être envoyé.',
    })
  } catch (error) {
    console.error('Erreur demande réinitialisation', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/password/reset', async (req, res) => {
  const token = sanitize(req.body?.token)
  const password =
    typeof req.body?.password === 'string' ? req.body.password.trim() : ''

  if (!token || !password) {
    return res.status(400).json({ error: 'Token et mot de passe requis' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe trop court (8 caractères min.)' })
  }

  const tokenHash = hashVerificationToken(token)

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query<DbUser>(
      `
      UPDATE users
      SET password_hash = $1,
          password_reset_token = NULL,
          password_reset_expires_at = NULL
      WHERE password_reset_token = $2
        AND password_reset_expires_at > NOW()
      RETURNING
        id,
        login,
        password_hash,
        role,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        email_verified,
        created_at
    `,
      [passwordHash, tokenHash],
    )

    const user = rows[0]
    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' })
    }

    res.json({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' })
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token')
  res.json({ message: 'Déconnexion réussie' })
})

router.post('/refresh', (req, res) => {
  const refresh = req.cookies?.refresh_token
  if (!refresh) {
    return res.status(401).json({ error: 'Refresh token manquant' })
  }

  try {
    const decoded = jwt.verify(refresh, JWT_SECRET) as TokenPayload
    const newAccess = createAccessToken({
      id: decoded.id,
      login: decoded.login,
      role: decoded.role,
    })
    res.cookie('access_token', newAccess, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    res.json({ message: 'Token renouvelé' })
  } catch {
    res.status(403).json({ error: 'Refresh token invalide ou expiré' })
  }
})

router.get('/whoami', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' })
  }

  try {
    const { rows } = await pool.query<DbUser>(
      `
      SELECT
        id,
        login,
        password_hash,
        role,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        email_verified,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
      [req.user.id],
    )

    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    res.json({ user: toSafeUser(user) })
  } catch (error) {
    console.error('Erreur whoami', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

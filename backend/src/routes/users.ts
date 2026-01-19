// Role : Gerer les routes utilisateurs (profil et administration).
import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { sendVerificationEmail } from '../services/email.js'
import { ADMIN_EMAIL, ADMIN_LOGIN } from '../config/env.js'

const router = Router()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_VERIFICATION_EXPIRATION_MS = 24 * 60 * 60 * 1000
const ALLOWED_ROLES = new Set([
  'benevole',
  'organizer',
  'super-organizer',
  'admin',
])
const ROLE_ALIASES: Record<string, string> = {
  admin: 'admin',
  benevole: 'benevole',
  'bénévole': 'benevole',
  organizer: 'organizer',
  organisateur: 'organizer',
  'super-organizer': 'super-organizer',
  superorganizer: 'super-organizer',
  'super-organisateur': 'super-organizer',
  superorganisateur: 'super-organizer',
}
const PROTECTED_ADMIN_ID = 1
const PROTECTED_ADMIN_LOGIN = ADMIN_LOGIN.toLowerCase()
const PROTECTED_ADMIN_EMAIL = ADMIN_EMAIL.toLowerCase()

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

// Role : Nettoyer une valeur texte.
// Preconditions : value peut etre de tout type.
// Postconditions : Retourne une chaine nettoyee ou vide.
function sanitize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// Role : Hasher un token de verification email.
// Preconditions : token est une chaine non vide.
// Postconditions : Retourne le hash SHA-256.
function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Role : Normaliser un role utilisateur a partir d'aliases.
// Preconditions : input est une chaine non vide.
// Postconditions : Retourne un role canonical ou l'entree brute.
function normalizeRole(input: string): string {
  const raw = input.trim()
  const lowered = raw.toLowerCase()
  const withoutPrefix = lowered.startsWith('role') ? lowered.slice(4) : lowered
  return ROLE_ALIASES[withoutPrefix] ?? ROLE_ALIASES[lowered] ?? raw
}

// Role : Verifier si un utilisateur est le compte admin initial protege.
// Preconditions : userId est un entier positif.
// Postconditions : Retourne true si l'utilisateur correspond au compte admin initial.
async function isProtectedAdmin(userId: number): Promise<boolean> {
  const { rows } = await pool.query<{ id: number; login: string; email: string }>(
    'SELECT id, login, email FROM users WHERE id = $1',
    [userId],
  )
  const user = rows[0]
  if (!user) {
    return false
  }
  const login = user.login?.toLowerCase() ?? ''
  const email = user.email?.toLowerCase() ?? ''
  return (
    user.id === PROTECTED_ADMIN_ID ||
    login === PROTECTED_ADMIN_LOGIN ||
    email === PROTECTED_ADMIN_EMAIL
  )
}

// Role : Recuperer le profil de l'utilisateur connecte.
// Preconditions : req.user est defini.
// Postconditions : Retourne le profil ou une erreur.
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

// Role : Mettre a jour le profil de l'utilisateur connecte.
// Preconditions : req.user est defini et le payload est valide.
// Postconditions : Retourne le profil mis a jour ou une erreur.
router.put('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' })
  }

  const userId = Number(req.user.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  const login =
    typeof req.body?.login === 'string' ? sanitize(req.body.login) : undefined
  const firstName =
    typeof req.body?.firstName === 'string' ? sanitize(req.body.firstName) : undefined
  const lastName =
    typeof req.body?.lastName === 'string' ? sanitize(req.body.lastName) : undefined
  const email =
    typeof req.body?.email === 'string'
      ? sanitize(req.body.email).toLowerCase()
      : undefined
  const hasPhone = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'phone')
  const phone = hasPhone
    ? typeof req.body?.phone === 'string'
      ? sanitize(req.body.phone)
      : null
    : undefined
  const hasAvatar = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'avatarUrl')
  const avatarUrl = hasAvatar
    ? typeof req.body?.avatarUrl === 'string'
      ? sanitize(req.body.avatarUrl)
      : null
    : undefined

  if (login !== undefined && !login) {
    return res.status(400).json({ error: 'Login invalide' })
  }

  if (firstName !== undefined && !firstName) {
    return res.status(400).json({ error: 'Prénom invalide' })
  }

  if (lastName !== undefined && !lastName) {
    return res.status(400).json({ error: 'Nom invalide' })
  }

  if (email !== undefined && (!email || !EMAIL_REGEX.test(email))) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    const { rows: currentRows } = await pool.query<{
      login: string
      email: string
      avatarUrl: string | null
    }>(
      `
      SELECT login, email, avatar_url AS "avatarUrl"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
      [userId],
    )
    const currentUser = currentRows[0]
    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    if (login !== undefined || email !== undefined) {
      const { rows: existing } = await pool.query<{ login: string; email: string | null }>(
        `
        SELECT login, email
        FROM users
        WHERE (login = $1 OR LOWER(email) = LOWER($2))
          AND id <> $3
        LIMIT 1
      `,
        [login ?? currentUser.login, email ?? currentUser.email, userId],
      )

      const duplicate = existing[0]
      if (duplicate) {
        if (login !== undefined && duplicate.login === login) {
          return res.status(409).json({ error: 'Login déjà utilisé' })
        }
        const existingEmail = duplicate.email?.toLowerCase()
        if (email !== undefined && existingEmail && existingEmail === email) {
          return res.status(409).json({ error: 'Email déjà utilisé' })
        }
      }
    }

    const updates: string[] = []
    const values: Array<string | boolean | Date | null> = []

    const addUpdate = (column: string, value: string | boolean | Date | null) => {
      updates.push(`${column} = $${updates.length + 1}`)
      values.push(value)
    }

    if (login !== undefined) {
      addUpdate('login', login)
    }
    if (firstName !== undefined) {
      addUpdate('first_name', firstName)
    }
    if (lastName !== undefined) {
      addUpdate('last_name', lastName)
    }
    let verificationToken: string | null = null
    let verificationEmail: string | null = null
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase()
      if (normalizedEmail !== currentUser.email.toLowerCase()) {
        const token = crypto.randomBytes(32).toString('hex')
        const tokenHash = hashVerificationToken(token)
        const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRATION_MS)
        addUpdate('email', normalizedEmail)
        addUpdate('email_verified', false)
        addUpdate('email_verification_token', tokenHash)
        addUpdate('email_verification_expires_at', expiresAt)
        verificationToken = token
        verificationEmail = normalizedEmail
      } else {
        addUpdate('email', normalizedEmail)
      }
    }
    if (phone !== undefined) {
      addUpdate('phone', phone ? phone : null)
    }
    if (avatarUrl !== undefined) {
      addUpdate('avatar_url', avatarUrl ? avatarUrl : null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })
    }

    const { rows } = await pool.query<PublicUser>(
      `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${updates.length + 1}
      RETURNING ${SAFE_FIELDS}
    `,
      [...values, userId],
    )

    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    if (verificationToken && verificationEmail) {
      await sendVerificationEmail(verificationEmail, verificationToken)
    }

    res.json({
      message: verificationToken
        ? 'Profil mis à jour. Vérifiez votre nouvel email.'
        : 'Profil mis à jour.',
      user,
      emailVerificationSent: Boolean(verificationToken),
    })
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'Login ou email déjà utilisé' })
    } else {
      console.error('Erreur mise à jour profil', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
})

// Role : Supprimer le compte connecte.
// Preconditions : req.user est defini.
// Postconditions : Supprime le compte ou retourne une erreur.
router.delete('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' })
  }

  const userId = Number(req.user.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  if (await isProtectedAdmin(userId)) {
    return res
      .status(403)
      .json({ error: 'Impossible de supprimer le compte super administrateur initial' })
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId])
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.json({ message: 'Compte supprimé' })
  } catch (err) {
    console.error('Erreur suppression compte', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Role : Lister les utilisateurs (admin).
// Preconditions : requireAdmin a valide l'acces.
// Postconditions : Retourne la liste des utilisateurs ou une erreur.
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

// Role : Creer un utilisateur (admin).
// Preconditions : requireAdmin a valide l'acces et le payload est valide.
// Postconditions : Cree l'utilisateur ou retourne une erreur.
router.post('/', requireAdmin, async (req, res) => {
  const login = sanitize(req.body?.login)
  const password = sanitize(req.body?.password)
  const firstName = sanitize(req.body?.firstName)
  const lastName = sanitize(req.body?.lastName)
  const email = sanitize(req.body?.email).toLowerCase()
  const phone = sanitize(req.body?.phone)
  const avatarUrl = sanitize(req.body?.avatarUrl)
  const roleInput = typeof req.body?.role === 'string' ? sanitize(req.body.role) : ''
  const role = roleInput || 'benevole'

  if (!login || !password || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }

  if (roleInput && !ALLOWED_ROLES.has(roleInput)) {
    return res.status(400).json({ error: 'Role invalide' })
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NULL, NULL)
    `,
      [login, hash, role, firstName, lastName, email, phone || null, avatarUrl || null],
    )

    res.status(201).json({ message: 'Utilisateur créé' })
  } catch (err: any) {
    if (err?.code === '23505') {
      if (err?.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email deja utilise' })
      }
      if (err?.constraint === 'users_login_key') {
        return res.status(409).json({ error: 'Login deja utilise' })
      }
      res.status(409).json({ error: 'Login ou email deja utilise' })
    } else {
      console.error('Erreur création utilisateur', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
})

// Role : Recuperer un utilisateur par identifiant (admin).
// Preconditions : id est valide.
// Postconditions : Retourne l'utilisateur ou une erreur.
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

// Role : Mettre a jour un utilisateur (admin).
// Preconditions : id est valide et le payload est valide.
// Postconditions : Retourne l'utilisateur mis a jour ou une erreur.
router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  const login =
    typeof req.body?.login === 'string' ? sanitize(req.body.login) : undefined
  const roleInput =
    typeof req.body?.role === 'string' ? sanitize(req.body.role) : undefined
  const role = roleInput !== undefined ? normalizeRole(roleInput) : undefined
  const firstName =
    typeof req.body?.firstName === 'string' ? sanitize(req.body.firstName) : undefined
  const lastName =
    typeof req.body?.lastName === 'string' ? sanitize(req.body.lastName) : undefined
  const email =
    typeof req.body?.email === 'string'
      ? sanitize(req.body.email).toLowerCase()
      : undefined
  const hasPhone = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'phone')
  const phone = hasPhone
    ? typeof req.body?.phone === 'string'
      ? sanitize(req.body.phone)
      : null
    : undefined
  const hasAvatar = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'avatarUrl')
  const avatarUrl = hasAvatar
    ? typeof req.body?.avatarUrl === 'string'
      ? sanitize(req.body.avatarUrl)
      : null
    : undefined
  const emailVerified =
    typeof req.body?.emailVerified === 'boolean' ? req.body.emailVerified : undefined

  if (role !== undefined && !ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Role invalide' })
  }

  if (login !== undefined && !login) {
    return res.status(400).json({ error: 'Login invalide' })
  }

  if (firstName !== undefined && !firstName) {
    return res.status(400).json({ error: 'Prénom invalide' })
  }

  if (lastName !== undefined && !lastName) {
    return res.status(400).json({ error: 'Nom invalide' })
  }

  if (email !== undefined && (!email || !EMAIL_REGEX.test(email))) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  if (role !== undefined && role !== 'admin') {
    try {
      const { rows } = await pool.query<{ id: number; login: string; email: string }>(
        `
        SELECT id, login, email
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
        [id],
      )
      const target = rows[0]
      if (!target) {
        return res.status(404).json({ error: 'Utilisateur introuvable' })
      }
      const isProtectedAdmin =
        target.id === PROTECTED_ADMIN_ID ||
        target.login === PROTECTED_ADMIN_LOGIN ||
        target.email.toLowerCase() === PROTECTED_ADMIN_EMAIL
      if (isProtectedAdmin) {
        return res
          .status(403)
          .json({ error: "Impossible de modifier le role de l'administrateur initial" })
      }
    } catch (err) {
      console.error('Erreur verification admin initial', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  const updates: string[] = []
  const values: Array<string | boolean | null> = []

  const addUpdate = (column: string, value: string | boolean | null) => {
    updates.push(`${column} = $${updates.length + 1}`)
    values.push(value)
  }

  if (login !== undefined) {
    addUpdate('login', login)
  }
  if (role !== undefined) {
    addUpdate('role', role)
  }
  if (firstName !== undefined) {
    addUpdate('first_name', firstName)
  }
  if (lastName !== undefined) {
    addUpdate('last_name', lastName)
  }
  if (email !== undefined) {
    addUpdate('email', email)
  }
  if (phone !== undefined) {
    addUpdate('phone', phone ? phone : null)
  }
  if (avatarUrl !== undefined) {
    addUpdate('avatar_url', avatarUrl ? avatarUrl : null)
  }
  if (emailVerified !== undefined) {
    addUpdate('email_verified', emailVerified)
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })
  }

  try {
    const { rows } = await pool.query<PublicUser>(
      `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${updates.length + 1}
      RETURNING ${SAFE_FIELDS}
    `,
      [...values, id],
    )

    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    res.json({ message: 'Utilisateur mis à jour', user })
  } catch (err: any) {
    if (err?.code === '23505') {
      if (err?.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email deja utilise' })
      }
      if (err?.constraint === 'users_login_key') {
        return res.status(409).json({ error: 'Login deja utilise' })
      }
      res.status(409).json({ error: 'Login ou email deja utilise' })
    } else {
      console.error('Erreur mise à jour utilisateur', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
})

// Role : Supprimer un utilisateur (admin).
// Preconditions : id est valide et requireAdmin a valide l'acces.
// Postconditions : Retourne un message de suppression ou une erreur.
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }
  
  // Protection du super admin initial
  if (await isProtectedAdmin(id)) {
    return res
      .status(403)
      .json({ error: 'Impossible de supprimer le compte super administrateur initial' })
  }
  
  const currentUserId = Number(req.user?.id)
  if (currentUserId === id) {
    return res
      .status(403)
      .json({ error: 'Impossible de supprimer votre propre compte' })
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1 AND id <> $2', [id, currentUserId])
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

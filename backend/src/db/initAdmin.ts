import bcrypt from 'bcryptjs'
import pool from './database.js'
import { ADMIN_EMAIL, ADMIN_LOGIN } from '../config/env.js'

// Role : Garantir l'existence du compte administrateur principal.
// Preconditions : La connexion a la base est disponible et les variables d'environnement sont chargees.
// Postconditions : Le compte admin est cree ou mis a jour avec les valeurs definies.
export async function ensureAdmin(): Promise<void> {
  const login = ADMIN_LOGIN
  const role = 'admin'
  const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin'
  const lastName = process.env.ADMIN_LAST_NAME ?? 'Account'
  const phone = process.env.ADMIN_PHONE ?? null
  const avatarUrl = process.env.ADMIN_AVATAR_URL ?? null
  const email = ADMIN_EMAIL

  const { rows } = await pool.query<{ id: number }>(
    'SELECT id FROM users WHERE login = $1 LIMIT 1',
    [login],
  )
  if (rows.length > 0) {
    return
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password || password.trim().length === 0 || password === 'adminadmin') {
    throw new Error('ADMIN_PASSWORD doit etre defini avec une valeur non par defaut')
  }

  const passwordHash = await bcrypt.hash(password, 10)

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
    ON CONFLICT (login) DO NOTHING
    `,
    [login, passwordHash, role, firstName, lastName, email, phone, avatarUrl],
  )
}

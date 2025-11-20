import bcrypt from 'bcryptjs'
import pool from './database.js'
import { ADMIN_EMAIL } from '../config/env.js'

export async function ensureAdmin(): Promise<void> {
  const login = process.env.ADMIN_LOGIN ?? 'admin'
  const password = process.env.ADMIN_PASSWORD ?? 'adminadmin'
  const role = 'admin'
  const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin'
  const lastName = process.env.ADMIN_LAST_NAME ?? 'Account'
  const phone = process.env.ADMIN_PHONE ?? null
  const avatarUrl = process.env.ADMIN_AVATAR_URL ?? null
  const email = ADMIN_EMAIL

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
    ON CONFLICT (login) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          email_verified = TRUE,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
    `,
    [login, passwordHash, role, firstName, lastName, email, phone, avatarUrl],
  )
}

import bcrypt from 'bcryptjs'
import pool from './database.js'

export async function ensureAdmin(): Promise<void> {
  const login = process.env.ADMIN_LOGIN ?? 'admin'
  const password = process.env.ADMIN_PASSWORD ?? 'adminadmin'
  const role = 'admin'

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM users WHERE login = $1',
    [login],
  )
  if (existing.rows.length > 0) return

  const passwordHash = await bcrypt.hash(password, 10)

  await pool.query(
    `
    INSERT INTO users (login, password_hash, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (login) DO NOTHING
    `,
    [login, passwordHash, role],
  )
}

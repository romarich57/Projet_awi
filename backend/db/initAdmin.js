import pool from '../src/db/database.js';
import bcrypt from 'bcryptjs';
export async function ensureAdmin() {
    const defaults = [
        { login: 'admin', password: 'admin', role: 'admin' },
        { login: 'user', password: 'user', role: 'user' },
    ];
    for (const { login, password, role } of defaults) {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(`INSERT INTO users (login, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (login) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role`, [login, hash, role]);
    }
    console.log('👍 Comptes par défaut vérifiés/créés (admin/user)');
}
//# sourceMappingURL=initAdmin.js.map
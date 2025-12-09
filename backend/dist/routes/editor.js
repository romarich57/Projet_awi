import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
router.get('/', async (_req, res) => {
    try {
        const { rows } = await pool.query(`SELECT id, name, email, website, description, logo_url, is_exhibitor, is_distributor
       FROM editor
       ORDER BY name ASC`);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des éditeurs', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
export default router;
//# sourceMappingURL=editor.js.map
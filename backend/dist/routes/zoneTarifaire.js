import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
// zone tarifaire liste du festival courant 
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT id, name, festival_id, nb_tables, price_per_table, nb_tables_available, m2_price FROM zone_tarifaire WHERE festival_id = $1 ORDER BY id ASC', [id]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des zones tarifaires:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Création d'une nouvelle zone tarifaire
router.post('/', async (req, res) => {
    const { name, nb_tables, price_per_table, festival_id, nb_tables_available, m2_price } = req.body;
    if (!name || nb_tables === undefined || price_per_table === undefined || !festival_id) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    try {
        // Utiliser nb_tables comme valeur par défaut pour nb_tables_available si non fourni
        const tablesAvailable = nb_tables_available !== undefined ? nb_tables_available : nb_tables;
        // Calcul automatique du prix par m² si non fourni
        // On considère qu'une table occupe environ 4.5 m² (table + espace circulation)
        const M2_PER_TABLE = 4.5;
        const priceM2 = m2_price !== undefined ? m2_price : parseFloat((price_per_table / M2_PER_TABLE).toFixed(2));
        const { rows } = await pool.query(`INSERT INTO zone_tarifaire (name, festival_id, nb_tables, price_per_table, nb_tables_available, m2_price)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, festival_id, nb_tables, price_per_table, nb_tables_available, m2_price`, [name, festival_id, nb_tables, price_per_table, tablesAvailable, priceM2]);
        res.status(201).json({ message: 'Zone tarifaire créée', zone_tarifaire: rows[0] });
    }
    catch (err) {
        console.error('Erreur lors de la création de la zone tarifaire:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
});
//suppression d'une zone tarifaire par ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM zone_tarifaire WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
        }
        res.json({ message: 'Zone tarifaire supprimée' });
    }
    catch (err) {
        console.error('Erreur lors de la suppression de la zone tarifaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
//mise à jour d'une zone tarifaire par ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, nb_tables, price_per_table, nb_tables_available, m2_price } = req.body;
    try {
        const { rowCount } = await pool.query(`UPDATE zone_tarifaire
             SET name = $1, nb_tables = $2, price_per_table = $3, nb_tables_available = $4, m2_price = $5
             WHERE id = $6`, [name, nb_tables, price_per_table, nb_tables_available, m2_price, id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
        }
        res.json({ message: 'Zone tarifaire mise à jour' });
    }
    catch (err) {
        console.error('Erreur lors de la mise à jour de la zone tarifaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
export default router;
//# sourceMappingURL=zoneTarifaire.js.map
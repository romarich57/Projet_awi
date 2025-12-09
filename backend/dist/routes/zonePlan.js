import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
// Récupérer toutes les zones de plan d'un festival
router.get('/:festival_id', async (req, res) => {
    const { festival_id } = req.params;
    try {
        const { rows } = await pool.query(`SELECT zp.id, zp.name, zp.festival_id, zp.id_zone_tarifaire, zp.nb_tables,
                    zt.name as zone_tarifaire_name, zt.price_per_table, zt.m2_price
             FROM zone_plan zp
             LEFT JOIN zone_tarifaire zt ON zp.id_zone_tarifaire = zt.id
             WHERE zp.festival_id = $1 
             ORDER BY zp.id ASC`, [festival_id]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des zones de plan:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Création d'une nouvelle zone de plan
router.post('/', async (req, res) => {
    const { name, festival_id, id_zone_tarifaire, nb_tables } = req.body;
    if (!name || !festival_id || !id_zone_tarifaire || nb_tables === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants (name, festival_id, id_zone_tarifaire, nb_tables)' });
    }
    if (nb_tables < 0) {
        return res.status(400).json({ error: 'Le nombre de tables doit être positif' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Vérifier que le festival existe
        const { rows: festivalRows } = await client.query('SELECT id FROM festival WHERE id = $1', [festival_id]);
        if (festivalRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Festival non trouvé' });
        }
        // Vérifier que la zone tarifaire existe et appartient au même festival
        const { rows: zoneTarifaireRows } = await client.query('SELECT id, festival_id FROM zone_tarifaire WHERE id = $1', [id_zone_tarifaire]);
        if (zoneTarifaireRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
        }
        if (zoneTarifaireRows[0].festival_id !== parseInt(festival_id)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La zone tarifaire n\'appartient pas au festival spécifié' });
        }
        // Créer la zone de plan
        const { rows } = await client.query(`INSERT INTO zone_plan (name, festival_id, id_zone_tarifaire, nb_tables)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, festival_id, id_zone_tarifaire, nb_tables`, [name, festival_id, id_zone_tarifaire, nb_tables]);
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Zone de plan créée avec succès',
            zone_plan: rows[0]
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création de la zone de plan:', err);
        // Gestion des erreurs spécifiques
        if (err instanceof Error && err.message.includes('duplicate key')) {
            return res.status(409).json({ error: 'Une zone de plan avec ce nom existe déjà' });
        }
        res.status(500).json({
            error: 'Erreur serveur',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    }
    finally {
        client.release();
    }
});
// Suppression d'une zone de plan par ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Vérifier s'il y a des jeux alloués liés à cette zone de plan
        const { rows: jeuxAllouesRows } = await client.query('SELECT COUNT(*) as count FROM jeux_alloues WHERE zone_plan_id = $1', [id]);
        if (parseInt(jeuxAllouesRows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Impossible de supprimer cette zone de plan car elle contient des jeux alloués'
            });
        }
        // Supprimer la zone de plan
        const { rowCount } = await client.query('DELETE FROM zone_plan WHERE id = $1', [id]);
        await client.query('COMMIT');
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Zone de plan non trouvée' });
        }
        res.json({ message: 'Zone de plan supprimée avec succès' });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la suppression de la zone de plan:', err);
        res.status(500).json({
            error: 'Erreur serveur',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    }
    finally {
        client.release();
    }
});
export default router;
//# sourceMappingURL=zonePlan.js.map
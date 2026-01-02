import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Récupérer toutes les zones de plan d'un festival
router.get('/:festival_id', async (req, res) => {
    const { festival_id } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT zp.id, zp.name, zp.festival_id, zp.id_zone_tarifaire, zp.nb_tables,
                    zt.name as zone_tarifaire_name, zt.price_per_table, zt.m2_price
             FROM zone_plan zp
             LEFT JOIN zone_tarifaire zt ON zp.id_zone_tarifaire = zt.id
             WHERE zp.festival_id = $1 
             ORDER BY zp.id ASC`, 
            [festival_id]
        );
        res.json(rows);
    } catch (err) {
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
        const { rows: festivalRows } = await client.query(
            'SELECT id FROM festival WHERE id = $1',
            [festival_id]
        );
        
        if (festivalRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Festival non trouvé' });
        }
        
        // Vérifier que la zone tarifaire existe et appartient au même festival
        const { rows: zoneTarifaireRows } = await client.query(
            'SELECT id, festival_id FROM zone_tarifaire WHERE id = $1',
            [id_zone_tarifaire]
        );
        
        if (zoneTarifaireRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
        }
        
        if (zoneTarifaireRows[0].festival_id !== parseInt(festival_id)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La zone tarifaire n\'appartient pas au festival spécifié' });
        }
        
        // Créer la zone de plan
        const { rows } = await client.query(
            `INSERT INTO zone_plan (name, festival_id, id_zone_tarifaire, nb_tables)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, festival_id, id_zone_tarifaire, nb_tables`,
            [name, festival_id, id_zone_tarifaire, nb_tables]
        );
        
        await client.query('COMMIT');
        res.status(201).json({ 
            message: 'Zone de plan créée avec succès', 
            zone_plan: rows[0] 
        });
        
    } catch (err) {
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
    } finally {
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
        const { rows: jeuxAllouesRows } = await client.query(
            'SELECT COUNT(*) as count FROM jeux_alloues WHERE zone_plan_id = $1',
            [id]
        );
        
        if (parseInt(jeuxAllouesRows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Impossible de supprimer cette zone de plan car elle contient des jeux alloués' 
            });
        }
        
        // Supprimer la zone de plan
        const { rowCount } = await client.query(
            'DELETE FROM zone_plan WHERE id = $1',
            [id]
        );
        
        await client.query('COMMIT');
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Zone de plan non trouvée' });
        }
        
        res.json({ message: 'Zone de plan supprimée avec succès' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la suppression de la zone de plan:', err);
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
    } finally {
        client.release();
    }
});

// Récupérer les jeux alloués d'une zone de plan
router.get('/:id/jeux-alloues', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { rows } = await pool.query(
            `SELECT
                ja.id AS allocation_id,
                ja.reservation_id,
                ja.game_id,
                ja.nb_tables_occupees,
                ja.nb_exemplaires,
                ja.zone_plan_id,
                ja.taille_table_requise,
                g.title,
                g.type,
                g.editor_id,
                e.name AS editor_name,
                g.min_age,
                g.authors,
                g.min_players,
                g.max_players,
                g.prototype,
                g.duration_minutes,
                g.theme,
                g.description,
                g.image_url,
                g.rules_video_url,
                r.reservant_id,
                u.company_name AS reservant_name,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'description', m.description))
                        FILTER (WHERE m.id IS NOT NULL),
                    '[]'
                ) AS mechanisms
            FROM jeux_alloues ja
            JOIN games g ON g.id = ja.game_id
            LEFT JOIN editor e ON e.id = g.editor_id
            LEFT JOIN game_mechanism gm ON gm.game_id = g.id
            LEFT JOIN mechanism m ON m.id = gm.mechanism_id
            LEFT JOIN reservation r ON r.id = ja.reservation_id
            LEFT JOIN users u ON u.id = r.reservant_id
            WHERE ja.zone_plan_id = $1
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url, r.reservant_id, u.company_name
            ORDER BY g.title ASC`,
            [id]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des jeux alloués de la zone de plan:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer les jeux NON alloués à aucune zone pour un festival donné
router.get('/festival/:festival_id/jeux-non-alloues', async (req, res) => {
    const { festival_id } = req.params;
    
    try {
        const { rows } = await pool.query(
            `SELECT
                ja.id AS allocation_id,
                ja.reservation_id,
                ja.game_id,
                ja.nb_tables_occupees,
                ja.nb_exemplaires,
                ja.zone_plan_id,
                ja.taille_table_requise,
                g.title,
                g.type,
                g.editor_id,
                e.name AS editor_name,
                g.min_age,
                g.authors,
                g.min_players,
                g.max_players,
                g.prototype,
                g.duration_minutes,
                g.theme,
                g.description,
                g.image_url,
                g.rules_video_url,
                r.reservant_id,
                u.company_name AS reservant_name,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'description', m.description))
                        FILTER (WHERE m.id IS NOT NULL),
                    '[]'
                ) AS mechanisms
            FROM jeux_alloues ja
            JOIN games g ON g.id = ja.game_id
            JOIN reservation r ON r.id = ja.reservation_id
            LEFT JOIN editor e ON e.id = g.editor_id
            LEFT JOIN game_mechanism gm ON gm.game_id = g.id
            LEFT JOIN mechanism m ON m.id = gm.mechanism_id
            LEFT JOIN users u ON u.id = r.reservant_id
            WHERE r.festival_id = $1 AND ja.zone_plan_id IS NULL
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url, r.reservant_id, u.company_name
            ORDER BY g.title ASC`,
            [festival_id]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des jeux non alloués:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

//mettre à jour une zone de plan
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, id_zone_tarifaire, nb_tables } = req.body;

    if (!name || !id_zone_tarifaire || nb_tables === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants (name, id_zone_tarifaire, nb_tables)' });
    }

    if (nb_tables < 0) {
        return res.status(400).json({ error: 'Le nombre de tables doit être positif' });
    }

    try {
        const { rowCount } = await pool.query(
            `UPDATE zone_plan
             SET name = $1, id_zone_tarifaire = $2, nb_tables = $3
             WHERE id = $4`,
            [name, id_zone_tarifaire, nb_tables, id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Zone de plan non trouvée' });
        }

        res.json({ message: 'Zone de plan mise à jour avec succès' });

    } catch (err) {
        console.error('Erreur lors de la mise à jour de la zone de plan:', err);
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
    }
});


export default router;
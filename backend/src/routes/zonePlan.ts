import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Récupérer les allocations simples d'une réservation (tables sans jeux)
router.get('/reservation/:reservation_id/allocations', async (req, res) => {
    const reservationId = Number(req.params.reservation_id);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT reservation_id, zone_plan_id, nb_tables, nb_chaises
             FROM reservation_zone_plan
             WHERE reservation_id = $1
             ORDER BY zone_plan_id`,
            [reservationId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des allocations simples:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer ou mettre à jour une allocation simple (tables sans jeux)
router.put('/reservation/:reservation_id/allocations/:zone_plan_id', async (req, res) => {
    const reservationId = Number(req.params.reservation_id);
    const zonePlanId = Number(req.params.zone_plan_id);
    const nbTables = Number(req.body?.nb_tables ?? 0);
    const nbChaises = Number(req.body?.nb_chaises ?? 0);

    if (!Number.isFinite(reservationId) || !Number.isFinite(zonePlanId)) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }
    // Au moins une table ou une chaise doit être allouée
    if ((nbTables <= 0 && nbChaises <= 0) || nbTables < 0 || nbChaises < 0) {
        return res.status(400).json({ error: 'nb_tables ou nb_chaises doit être positif' });
    }

    try {
        const { rows: validationRows } = await pool.query(
            `SELECT r.festival_id AS reservation_festival, zp.festival_id AS zone_festival
             FROM reservation r
             JOIN zone_plan zp ON zp.id = $2
             WHERE r.id = $1`,
            [reservationId, zonePlanId]
        );

        if (validationRows.length === 0) {
            return res.status(404).json({ error: 'Réservation ou zone de plan introuvable' });
        }

        if (validationRows[0].reservation_festival !== validationRows[0].zone_festival) {
            return res.status(400).json({
                error: 'La zone de plan ne correspond pas au festival de la réservation'
            });
        }

        // Vérifier que les chaises allouées ne dépassent pas le stock global du festival
        const festivalId = validationRows[0].reservation_festival;
        const { rows: festivalRows } = await pool.query(
            `SELECT stock_chaises FROM festival WHERE id = $1`,
            [festivalId]
        );
        const totalChaises = Number(festivalRows[0]?.stock_chaises || 0);

        const { rows: alloueesRows } = await pool.query(
            `SELECT COALESCE(SUM(rzp.nb_chaises), 0) as total_allouees
             FROM reservation_zone_plan rzp
             JOIN zone_plan zp ON rzp.zone_plan_id = zp.id
             WHERE zp.festival_id = $1`,
            [festivalId]
        );

        const { rows: currentRows } = await pool.query(
            `SELECT nb_chaises
             FROM reservation_zone_plan
             WHERE reservation_id = $1 AND zone_plan_id = $2`,
            [reservationId, zonePlanId]
        );

        const totalAllouees = Number(alloueesRows[0]?.total_allouees || 0);
        const currentAllocation = Number(currentRows[0]?.nb_chaises || 0);
        const disponiblesBase = Math.max(0, totalChaises - totalAllouees);
        const maxChaises = disponiblesBase + currentAllocation;

        if (nbChaises > maxChaises) {
            return res.status(400).json({
                error: `Pas assez de chaises disponibles. Disponibles: ${maxChaises}, Demandées: ${nbChaises}`
            });
        }

        const { rows } = await pool.query(
            `INSERT INTO reservation_zone_plan (reservation_id, zone_plan_id, nb_tables, nb_chaises)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (reservation_id, zone_plan_id)
             DO UPDATE SET nb_tables = EXCLUDED.nb_tables, nb_chaises = EXCLUDED.nb_chaises
             RETURNING reservation_id, zone_plan_id, nb_tables, nb_chaises`,
            [reservationId, zonePlanId, nbTables, nbChaises]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'allocation simple:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer une allocation simple (tables sans jeux)
router.delete('/reservation/:reservation_id/allocations/:zone_plan_id', async (req, res) => {
    const reservationId = Number(req.params.reservation_id);
    const zonePlanId = Number(req.params.zone_plan_id);

    if (!Number.isFinite(reservationId) || !Number.isFinite(zonePlanId)) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }

    try {
        const { rowCount } = await pool.query(
            `DELETE FROM reservation_zone_plan
             WHERE reservation_id = $1 AND zone_plan_id = $2`,
            [reservationId, zonePlanId]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Allocation introuvable' });
        }
        res.json({ message: 'Allocation supprimée avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression de l\'allocation simple:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer le total des allocations simples par zone de plan pour un festival
router.get('/festival/:festival_id/allocations-simple', async (req, res) => {
    const festivalId = Number(req.params.festival_id);
    if (!Number.isFinite(festivalId)) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT rzp.zone_plan_id, 
                    COALESCE(SUM(rzp.nb_tables), 0) AS nb_tables,
                    COALESCE(SUM(rzp.nb_chaises), 0) AS nb_chaises
             FROM reservation_zone_plan rzp
             JOIN reservation r ON r.id = rzp.reservation_id
             WHERE r.festival_id = $1
             GROUP BY rzp.zone_plan_id
             ORDER BY rzp.zone_plan_id`,
            [festivalId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des allocations simples par festival:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer le total des allocations (simples + jeux) par zone de plan pour un festival
router.get('/festival/:festival_id/allocations-global', async (req, res) => {
    const festivalId = Number(req.params.festival_id);
    if (!Number.isFinite(festivalId)) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT zp.id AS zone_plan_id,
                    (COALESCE(rzp_sum.nb_tables, 0) + COALESCE(ja_sum.nb_tables_jeux, 0)) AS nb_tables,
                    COALESCE(rzp_sum.nb_chaises, 0) AS nb_chaises
             FROM zone_plan zp
             LEFT JOIN (
                SELECT zone_plan_id, SUM(nb_tables) AS nb_tables, SUM(nb_chaises) AS nb_chaises
                FROM reservation_zone_plan
                GROUP BY zone_plan_id
             ) rzp_sum ON rzp_sum.zone_plan_id = zp.id
             LEFT JOIN (
                SELECT zone_plan_id, SUM(nb_tables_occupees) AS nb_tables_jeux
                FROM jeux_alloues
                WHERE zone_plan_id IS NOT NULL
                GROUP BY zone_plan_id
             ) ja_sum ON ja_sum.zone_plan_id = zp.id
             WHERE zp.festival_id = $1
             ORDER BY zp.id`,
            [festivalId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des allocations globales par festival:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

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
        
        // Vérifier s'il y a des jeux alloués ou des réservations simples liées à cette zone de plan
        const { rows: jeuxAllouesRows } = await client.query(
            'SELECT COUNT(*) as count FROM jeux_alloues WHERE zone_plan_id = $1',
            [id]
        );
        const { rows: reservationsRows } = await client.query(
            'SELECT COUNT(*) as count FROM reservation_zone_plan WHERE zone_plan_id = $1',
            [id]
        );
        
        if (parseInt(jeuxAllouesRows[0].count) > 0 || parseInt(reservationsRows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Impossible de supprimer cette zone de plan car elle contient des allocations' 
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
                res.name AS reservant_name,
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
            LEFT JOIN reservant res ON res.id = r.reservant_id
            WHERE ja.zone_plan_id = $1
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url, r.reservant_id, res.name
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
    const reservationId = req.query.reservationId ? Number(req.query.reservationId) : null;

    if (reservationId !== null && !Number.isFinite(reservationId)) {
        return res.status(400).json({ error: 'Identifiant de réservation invalide' });
    }

    const params: Array<number> = [Number(festival_id)];
    const reservationFilter = reservationId !== null ? 'AND ja.reservation_id = $2' : '';
    if (reservationId !== null) {
        params.push(reservationId);
    }

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
                res.name AS reservant_name,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'description', m.description))
                        FILTER (WHERE m.id IS NOT NULL),
                    '[]'
                ) AS mechanisms,
                COALESCE(
                    (SELECT json_agg(DISTINCT rzt.zone_tarifaire_id)
                     FROM reservation_zones_tarifaires rzt
                     WHERE rzt.reservation_id = r.id),
                    '[]'
                ) AS zones_tarifaires_reservees
            FROM jeux_alloues ja
            JOIN games g ON g.id = ja.game_id
            JOIN reservation r ON r.id = ja.reservation_id
            LEFT JOIN editor e ON e.id = g.editor_id
            LEFT JOIN game_mechanism gm ON gm.game_id = g.id
            LEFT JOIN mechanism m ON m.id = gm.mechanism_id
            LEFT JOIN reservant res ON res.id = r.reservant_id
            WHERE r.festival_id = $1 AND ja.zone_plan_id IS NULL
            ${reservationFilter}
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url, r.reservant_id, res.name, r.id
            ORDER BY g.title ASC`,
            params
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

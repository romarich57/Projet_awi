import { Router } from 'express'
import type { Pool, PoolClient } from 'pg'
import pool from '../db/database.js'

const router = Router();

async function findReservationId(
    festivalId: number,
    reservantId: number,
    client: Pool | PoolClient = pool,
): Promise<number | null> {
    const { rows } = await client.query(
        'SELECT id FROM reservation WHERE festival_id = $1 AND reservant_id = $2',
        [festivalId, reservantId],
    );
    return rows.length > 0 ? rows[0].id : null;
}

function validateAllocationPayload(body: any): { errors: string[], payload: any } {
    const errors: string[] = [];
    const payload: any = {};

    const gameId = Number(body?.game_id);
    const nbExemplaires = Number(body?.nb_exemplaires);
    const nbTablesOccupees = Number(body?.nb_tables_occupees);
    const zonePlanIdRaw = body?.zone_plan_id;
    const zonePlanId =
        zonePlanIdRaw === undefined || zonePlanIdRaw === null || zonePlanIdRaw === ''
            ? null
            : Number(zonePlanIdRaw);
    const tailleTable = typeof body?.taille_table_requise === 'string'
        ? body.taille_table_requise
        : undefined;

    if (!Number.isFinite(gameId)) errors.push('game_id est requis');
    if (!Number.isFinite(nbExemplaires) || nbExemplaires <= 0) errors.push('nb_exemplaires doit être positif');
    if (!Number.isFinite(nbTablesOccupees) || nbTablesOccupees <= 0) errors.push('nb_tables_occupees doit être positif');

    if (zonePlanId !== null) {
        if (!Number.isFinite(zonePlanId) || zonePlanId <= 0) {
            errors.push('zone_plan_id invalide');
        }
    }
    if (tailleTable && !['standard', 'grande', 'mairie'].includes(tailleTable)) {
        errors.push('taille_table_requise invalide');
    }

    payload.game_id = gameId;
    payload.nb_exemplaires = nbExemplaires;
    payload.nb_tables_occupees = nbTablesOccupees;
    payload.zone_plan_id = zonePlanId;
    payload.taille_table_requise = tailleTable ?? 'standard';

    return { errors, payload };
}

// Liste des festivals
router.get('/', async (_req, res) => {
    const { rows } = await pool.query('SELECT id, name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date FROM festival ORDER BY start_date DESC')
    res.json(rows)
})

// Détails d'un festival par ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const { rows } = await pool.query(
        'SELECT id, name, start_date, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises FROM festival WHERE id = $1',
        [id]
    )
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Festival non trouvé' })
    }
    res.json(rows[0]) // Renvoi du festival trouvé
})

// Création d'un nouveau festival
router.post('/', async (req, res) => {
    const { name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date } = req.body
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' })
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO festival (name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date`,
            [name, stock_tables_standard || 0, stock_tables_grande || 0, stock_tables_mairie || 0, stock_chaises || 0, start_date, end_date]
        )
        res.status(201).json({ message: 'Festival créé', festival: rows[0] })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})


// Mise à jour d'un festival par ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE festival
             SET name = $1, stock_tables_standard = $2, stock_tables_grande = $3, stock_tables_mairie = $4, stock_chaises = $5, start_date = $6, end_date = $7
             WHERE id = $8`,
            [name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date, id]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Festival non trouvé' })
        }
        res.json({ message: 'Festival mis à jour' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Jeux alloués à un réservant pour un festival donné
router.get('/:festivalId/reservants/:reservantId/games', async (req, res) => {
    const festivalId = Number(req.params.festivalId);
    const reservantId = Number(req.params.reservantId);
    if (!Number.isFinite(festivalId) || !Number.isFinite(reservantId)) {
        return res.status(400).json({ error: 'Identifiants invalides' });
    }

    try {
        const reservationId = await findReservationId(festivalId, reservantId);
        if (!reservationId) {
            return res.status(404).json({ error: 'Aucune réservation pour ce couple festival/réservant' });
        }

        const { rows } = await pool.query(
            `
            SELECT
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
            WHERE ja.reservation_id = $1
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url
            ORDER BY g.title ASC
            `,
            [reservationId],
        );

        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des jeux alloués', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un jeu alloué à un réservant pour un festival
router.post('/:festivalId/reservants/:reservantId/games', async (req, res) => {
    const festivalId = Number(req.params.festivalId);
    const reservantId = Number(req.params.reservantId);
    if (!Number.isFinite(festivalId) || !Number.isFinite(reservantId)) {
        return res.status(400).json({ error: 'Identifiants invalides' });
    }

    const { errors, payload } = validateAllocationPayload(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Payload invalide', details: errors });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const reservationId = await findReservationId(festivalId, reservantId, client);
        if (!reservationId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Aucune réservation pour ce couple festival/réservant' });
        }

        const { rows: existing } = await client.query(
            'SELECT id FROM jeux_alloues WHERE reservation_id = $1 AND game_id = $2',
            [reservationId, payload.game_id],
        );
        if (existing.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Ce jeu est déjà associé à cette réservation' });
        }

        const { rows: gameRows } = await client.query('SELECT id FROM games WHERE id = $1', [payload.game_id]);
        if (gameRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Jeu inexistant' });
        }

        const insertResult = await client.query(
            `
            INSERT INTO jeux_alloues (
                game_id, reservation_id, zone_plan_id, nb_tables_occupees, nb_exemplaires, taille_table_requise
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [
                payload.game_id,
                reservationId,
                payload.zone_plan_id,
                payload.nb_tables_occupees,
                payload.nb_exemplaires,
                payload.taille_table_requise,
            ],
        );

        const allocationId = insertResult.rows[0].id as number;
        await client.query('COMMIT');

        const { rows } = await pool.query(
            `
            SELECT
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
            WHERE ja.id = $1
            GROUP BY
                ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
                ja.zone_plan_id, ja.taille_table_requise,
                g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
                g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
                g.description, g.image_url, g.rules_video_url
            `,
            [allocationId],
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de l\'ajout du jeu à la réservation', err);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

// Suppression d'un festival par ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const { rowCount } = await pool.query('DELETE FROM festival WHERE id = $1', [id])
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Festival non trouvé' })
        }
        res.json({ message: 'Festival supprimé' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router

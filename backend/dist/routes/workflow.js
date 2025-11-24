import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
//Lister les réservants avec leurs infos pour un festival donné
router.get('/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(`SELECT r.id, r.name, r.email, r.type, r.editor_id,
                    e.name as editor_name, e.website as editor_website
             FROM Reservant r
             JOIN suivi_workflow sw ON r.id = sw.reservant_id
             LEFT JOIN Editor e ON r.editor_id = e.id
             WHERE sw.festival_id = $1
             ORDER BY r.name ASC`, [festivalId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des réservants:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Créer une nouvelle réservation avec réservant (création automatique si n'existe pas)
router.post('/reservation', async (req, res) => {
    const { reservant_name, reservant_email, reservant_type, festival_id, editor_name, editor_email, // Optionnels pour les réservants de type 'éditeur'
    start_price, nb_prises, final_price, table_discount_offered = 0, direct_discount = 0, note, phone_number, address, siret, zones_tarifaires = [] // Nouvelle structure pour les zones tarifaires
     } = req.body;
    if (!reservant_name || !reservant_email || !reservant_type || !festival_id || start_price === undefined || nb_prises === undefined || final_price === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let editorId = null;
        // 1. Si le réservant est de type 'editeur', créer/récupérer l'éditeur
        if (reservant_type === 'editeur' && editor_name && editor_email) {
            let editorResult = await client.query('SELECT id FROM Editor WHERE email = $1', [editor_email]);
            if (editorResult.rows.length === 0) {
                // Créer nouvel éditeur
                const newEditor = await client.query('INSERT INTO Editor (name, email) VALUES ($1, $2) RETURNING id', [editor_name, editor_email]);
                editorId = newEditor.rows[0].id;
            }
            else {
                editorId = editorResult.rows[0].id;
            }
        }
        // 2. Créer ou récupérer le réservant
        let reservantResult = await client.query('SELECT id FROM reservant WHERE email = $1', [reservant_email]);
        let reservantId;
        if (reservantResult.rows.length === 0) {
            // Créer nouveau réservant
            const newReservant = await client.query(`INSERT INTO reservant (name, email, type, editor_id, phone_number, address, siret)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [reservant_name, reservant_email, reservant_type, editorId, phone_number, address, siret]);
            reservantId = newReservant.rows[0].id;
        }
        else {
            reservantId = reservantResult.rows[0].id;
        }
        // 3. Créer le suivi_workflow
        const workflowResult = await client.query(`INSERT INTO suivi_workflow (reservant_id, festival_id, state)
             VALUES ($1, $2, 'Pas_de_contact')
             ON CONFLICT (reservant_id, festival_id) 
             DO UPDATE SET state = EXCLUDED.state
             RETURNING id`, [reservantId, festival_id]);
        const workflowId = workflowResult.rows[0].id;
        // 4. Créer la réservation
        const reservationResult = await client.query(`INSERT INTO reservation (
                reservant_id, festival_id, workflow_id,
                start_price, table_discount_offered, direct_discount, 
                nb_prises, final_price, note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`, [reservantId, festival_id, workflowId,
            start_price, table_discount_offered, direct_discount,
            nb_prises, final_price, note]);
        const reservationId = reservationResult.rows[0].id;
        // 5. Insérer les relations avec les zones tarifaires si spécifiées
        if (zones_tarifaires && zones_tarifaires.length > 0) {
            for (const zone of zones_tarifaires) {
                await client.query(`INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees)
                     VALUES ($1, $2, $3)`, [reservationId, zone.zone_tarifaire_id, zone.nb_tables_reservees]);
            }
        }
        await client.query('COMMIT');
        // Retourner les données complètes
        const completeResult = await client.query(`SELECT 
                r.*, 
                res.name as reservant_name, res.email as reservant_email, res.type as reservant_type,
                e.name as editor_name, e.email as editor_email,
                sw.state as workflow_state,
                f.name as festival_name
             FROM reservation r
             JOIN Reservant res ON r.reservant_id = res.id
             LEFT JOIN Editor e ON res.editor_id = e.id
             JOIN suivi_workflow sw ON r.workflow_id = sw.id
             JOIN festival f ON r.festival_id = f.id
             WHERE r.id = $1`, [reservationResult.rows[0].id]);
        res.status(201).json({
            message: 'Réservation créée avec succès',
            reservation: completeResult.rows[0]
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création de la réservation:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
    finally {
        client.release();
    }
});
// Lister toutes les réservations d'un festival avec détails complets
router.get('/reservations/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(`SELECT 
                r.id, r.start_price, r.final_price, r.statut_paiment, 
                r.date_facturation, r.note, r.nb_prises,
                res.name as reservant_name, res.email as reservant_email, 
                res.type as reservant_type, res.phone_number, res.address,
                e.name as editor_name, e.email as editor_email,
                sw.state as workflow_state,
                sw.liste_jeux_demandee, sw.liste_jeux_obtenue, 
                sw.jeux_recus, sw.presentera_jeux,
                zp.name as zone_name, zp.nb_tables,
                f.name as festival_name
             FROM reservation r
             JOIN Reservant res ON r.reservant_id = res.id
             LEFT JOIN Editor e ON res.editor_id = e.id
             JOIN suivi_workflow sw ON r.workflow_id = sw.id
             JOIN festival f ON r.festival_id = f.id
             LEFT JOIN zone_plan zp ON r.zone_plan_id = zp.id
             WHERE r.festival_id = $1
             ORDER BY sw.state, res.name`, [festivalId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des réservations:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
export default router;
//# sourceMappingURL=workflow.js.map
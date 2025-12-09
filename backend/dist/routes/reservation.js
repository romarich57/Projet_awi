import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
// Route pour consulter le stock disponible d'un festival
router.get('/stock/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(`SELECT 
                zt.id,
                zt.name,
                zt.nb_tables as total_tables,
                zt.nb_tables_available as available_tables,
                (zt.nb_tables - zt.nb_tables_available) as reserved_tables,
                zt.price_per_table
             FROM zone_tarifaire zt
             WHERE zt.festival_id = $1
             ORDER BY zt.name`, [festivalId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération du stock:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Lister toutes les réservations d'un festival avec détails complets
router.get('/reservations/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(`SELECT 
                r.id, r.start_price, r.final_price, r.statut_paiement,
                r.date_facturation, r.note, r.nb_prises,
                res.name as reservant_name, res.email as reservant_email,
                res.type as reservant_type, res.phone_number, res.address,
                e.name as editor_name, e.email as editor_email,
                sw.state as workflow_state,
                sw.liste_jeux_demandee, sw.liste_jeux_obtenue,
                sw.jeux_recus, sw.presentera_jeux,
                zt.name as zone_name, zt.price_per_table,
                rzt.nb_tables_reservees,
                f.name as festival_name
             FROM reservation r
             JOIN Reservant res ON r.reservant_id = res.id
             LEFT JOIN Editor e ON res.editor_id = e.id
             JOIN suivi_workflow sw ON r.workflow_id = sw.id
             JOIN festival f ON r.festival_id = f.id
             LEFT JOIN reservation_zones_tarifaires rzt ON r.id = rzt.reservation_id
             LEFT JOIN zone_tarifaire zt ON rzt.zone_tarifaire_id = zt.id
             WHERE r.festival_id = $1
             ORDER BY sw.state, res.name`, [festivalId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des réservations:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
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
        // 5. Insérer les relations avec les zones tarifaires et mettre à jour le stock
        if (zones_tarifaires && zones_tarifaires.length > 0) {
            for (const zone of zones_tarifaires) {
                // Vérifier le stock disponible
                const stockCheck = await client.query(`SELECT nb_tables_available FROM zone_tarifaire WHERE id = $1 FOR UPDATE`, [zone.zone_tarifaire_id]);
                if (stockCheck.rows.length === 0) {
                    throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} introuvable`);
                }
                const stockDisponible = stockCheck.rows[0].nb_tables_available;
                if (stockDisponible < zone.nb_tables_reservees) {
                    throw new Error(`Stock insuffisant pour la zone tarifaire ${zone.zone_tarifaire_id}. Disponible: ${stockDisponible}, Demandé: ${zone.nb_tables_reservees}`);
                }
                // Insérer la réservation de zone tarifaire
                await client.query(`INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees)
                     VALUES ($1, $2, $3)`, [reservationId, zone.zone_tarifaire_id, zone.nb_tables_reservees]);
                // Mettre à jour le stock disponible
                await client.query(`UPDATE zone_tarifaire 
                     SET nb_tables_available = nb_tables_available - $1 
                     WHERE id = $2`, [zone.nb_tables_reservees, zone.zone_tarifaire_id]);
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
//modifier une reservation
router.put('/reservation/:id', async (req, res) => {
    const { id } = req.params;
    const { start_price, nb_prises, final_price, table_discount_offered, direct_discount, note, zones_tarifaires = [] } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Récupérer les anciennes réservations de zones pour restaurer le stock
        const oldZones = await client.query(`SELECT zone_tarifaire_id, nb_tables_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`, [id]);
        // 2. Restaurer le stock des anciennes zones
        for (const oldZone of oldZones.rows) {
            await client.query(`UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`, [oldZone.nb_tables_reservees, oldZone.zone_tarifaire_id]);
        }
        // 3. Supprimer les anciennes associations
        await client.query(`DELETE FROM reservation_zones_tarifaires WHERE reservation_id = $1`, [id]);
        // 4. Mettre à jour la réservation
        const updateResult = await client.query(`UPDATE reservation
                SET start_price = $1,
                    nb_prises = $2,
                    final_price = $3,
                    table_discount_offered = $4,
                    direct_discount = $5,
                    note = $6
                WHERE id = $7
                RETURNING *`, [start_price, nb_prises, final_price,
            table_discount_offered, direct_discount,
            note, id]);
        // 5. Ajouter les nouvelles zones et décrémenter le stock
        for (const zone of zones_tarifaires) {
            // Vérifier le stock disponible
            const stockCheck = await client.query(`SELECT nb_tables_available FROM zone_tarifaire WHERE id = $1 FOR UPDATE`, [zone.zone_tarifaire_id]);
            if (stockCheck.rows.length === 0) {
                throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} introuvable`);
            }
            const stockDisponible = stockCheck.rows[0].nb_tables_available;
            if (stockDisponible < zone.nb_tables_reservees) {
                throw new Error(`Stock insuffisant pour la zone tarifaire ${zone.zone_tarifaire_id}. Disponible: ${stockDisponible}, Demandé: ${zone.nb_tables_reservees}`);
            }
            // Insérer la nouvelle réservation de zone
            await client.query(`INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees)
                 VALUES ($1, $2, $3)`, [id, zone.zone_tarifaire_id, zone.nb_tables_reservees]);
            // Décrémenter le stock
            await client.query(`UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available - $1 
                 WHERE id = $2`, [zone.nb_tables_reservees, zone.zone_tarifaire_id]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Réservation mise à jour avec succès', reservation: updateResult.rows[0] });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la mise à jour de la réservation:', err);
        res.status(500).json({
            error: 'Erreur serveur',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    }
    finally {
        client.release();
    }
});
// Supprimer une réservation et restaurer le stock
router.delete('/reservation/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Récupérer les zones tarifaires de la réservation pour restaurer le stock
        const zonesToRestore = await client.query(`SELECT zone_tarifaire_id, nb_tables_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`, [id]);
        // 2. Restaurer le stock des zones tarifaires
        for (const zone of zonesToRestore.rows) {
            await client.query(`UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`, [zone.nb_tables_reservees, zone.zone_tarifaire_id]);
        }
        // 3. Supprimer les associations zones tarifaires
        await client.query(`DELETE FROM reservation_zones_tarifaires WHERE reservation_id = $1`, [id]);
        // 4. Supprimer la réservation
        const deleteResult = await client.query(`DELETE FROM reservation WHERE id = $1 RETURNING *`, [id]);
        if (deleteResult.rows.length === 0) {
            throw new Error('Réservation introuvable');
        }
        await client.query('COMMIT');
        res.json({
            message: 'Réservation supprimée avec succès',
            reservation: deleteResult.rows[0]
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la suppression de la réservation:', err);
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
//# sourceMappingURL=reservation.js.map
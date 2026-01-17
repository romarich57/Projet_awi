import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Route pour consulter le stock disponible d'un festival
router.get('/stock/:festivalId', async (req, res) => {
    const { festivalId } = req.params;

    try {
        // Récupérer les zones tarifaires
        const zonesResult = await pool.query(
            `SELECT 
                zt.id,
                zt.name,
                zt.nb_tables as total_tables,
                zt.nb_tables_available as available_tables,
                (zt.nb_tables - zt.nb_tables_available) as reserved_tables,
                zt.price_per_table
             FROM zone_tarifaire zt
             WHERE zt.festival_id = $1
             ORDER BY zt.name`,
            [festivalId]
        );

        // Récupérer le stock de chaises du festival
        const festivalResult = await pool.query(
            `SELECT 
                stock_chaises as total_chaises
             FROM festival
             WHERE id = $1`,
            [festivalId]
        );

        const totalChaises = festivalResult.rows[0]?.total_chaises || 0;

        // Calculer dynamiquement le total des chaises ALLOUÉES aux zones de plan
        const chaisesAlloueesResult = await pool.query(
            `SELECT COALESCE(SUM(rzp.nb_chaises), 0) as total_allouees
             FROM reservation_zone_plan rzp
             JOIN zone_plan zp ON rzp.zone_plan_id = zp.id
             WHERE zp.festival_id = $1`,
            [festivalId]
        );

        const totalAllouees = Number(chaisesAlloueesResult.rows[0]?.total_allouees || 0);
        const availableCalculated = Math.max(0, totalChaises - totalAllouees);

        res.json({
            zones: zonesResult.rows,
            chaises: {
                total: totalChaises,
                available: availableCalculated,
                allocated: totalAllouees
            }
        });
    } catch (err) {
        console.error('Erreur lors de la récupération du stock:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Lister toutes les réservations d'un festival avec détails complets
router.get('/reservations/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT 
                r.id, r.start_price, r.final_price, r.statut_paiement,
                r.date_facturation, r.note, r.nb_prises, r.represented_editor_id,
                res.id as reservant_id,
                res.name as reservant_name, res.email as reservant_email,
                res.type as reservant_type, res.phone_number, res.address,
                e.id as editor_id, e.name as editor_name, e.email as editor_email,
                sw.state as workflow_state,
                sw.liste_jeux_demandee, sw.liste_jeux_obtenue,
                sw.jeux_recus, sw.presentera_jeux,
                f.name as festival_name,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'zone_name', zt.name,
                            'price_per_table', zt.price_per_table,
                            'nb_tables_reservees', rzt.nb_tables_reservees
                        )
                    ) FILTER (WHERE zt.id IS NOT NULL),
                    '[]'
                ) as zones_tarifaires
             FROM reservation r
             JOIN Reservant res ON r.reservant_id = res.id
             LEFT JOIN Editor e ON res.editor_id = e.id
             JOIN suivi_workflow sw ON r.workflow_id = sw.id
             JOIN festival f ON r.festival_id = f.id
             LEFT JOIN reservation_zones_tarifaires rzt ON r.id = rzt.reservation_id
             LEFT JOIN zone_tarifaire zt ON rzt.zone_tarifaire_id = zt.id
             WHERE r.festival_id = $1
             GROUP BY r.id, r.start_price, r.final_price, r.statut_paiement,
                r.date_facturation, r.note, r.nb_prises, r.represented_editor_id,
                res.id, res.name, res.email, res.type, res.phone_number, res.address,
                e.id, e.name, e.email,
                sw.state, sw.liste_jeux_demandee, sw.liste_jeux_obtenue,
                sw.jeux_recus, sw.presentera_jeux, f.name
             ORDER BY sw.state, res.name`,
            [festivalId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des réservations:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Récupérer une réservation par son ID avec ses zones tarifaires
router.get('/detail/:reservationId', async (req, res) => {
    const { reservationId } = req.params;
    try {
        // Récupérer la réservation
        const reservationResult = await pool.query(
            `SELECT 
                r.id, r.reservant_id, r.festival_id, r.workflow_id, r.represented_editor_id,
                r.start_price, r.table_discount_offered, r.direct_discount,
                r.nb_prises, r.date_facturation, r.final_price, r.statut_paiement, r.note,
                res.name as reservant_name, res.email as reservant_email, res.type as reservant_type,
                f.name as festival_name
             FROM reservation r
             JOIN reservant res ON r.reservant_id = res.id
             JOIN festival f ON r.festival_id = f.id
             WHERE r.id = $1`,
            [reservationId]
        );
        
        if (reservationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Réservation non trouvée' });
        }
        
        const reservation = reservationResult.rows[0];
        
        // Récupérer les zones tarifaires de cette réservation
        const zonesResult = await pool.query(
            `SELECT 
                rzt.zone_tarifaire_id,
                rzt.nb_tables_reservees,
                rzt.nb_chaises_reservees,
                zt.name as zone_name,
                zt.price_per_table,
                zt.nb_tables_available
             FROM reservation_zones_tarifaires rzt
             JOIN zone_tarifaire zt ON rzt.zone_tarifaire_id = zt.id
             WHERE rzt.reservation_id = $1`,
            [reservationId]
        );

        // Récupérer le stock de chaises du festival
        const festivalResult = await pool.query(
            `SELECT 
                stock_chaises as total_chaises,
                stock_chaises_available as available_chaises
             FROM festival
             WHERE id = $1`,
            [reservation.festival_id]
        );

        const chaisesStock = festivalResult.rows[0] || { total_chaises: 0, available_chaises: 0 };
        
        res.json({
            ...reservation,
            zones_tarifaires: zonesResult.rows,
            chaises_stock: {
                total: chaisesStock.total_chaises,
                available: chaisesStock.available_chaises
            }
        });
    } catch (err) {
        console.error('Erreur lors de la récupération de la réservation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


//Lister les réservants avec leurs infos pour un festival donné
router.get('/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT r.id, r.name, r.email, r.type, r.editor_id,
                    e.name as editor_name, e.website as editor_website
             FROM Reservant r
             JOIN suivi_workflow sw ON r.id = sw.reservant_id
             LEFT JOIN Editor e ON r.editor_id = e.id
             WHERE sw.festival_id = $1
             ORDER BY r.name ASC`,
            [festivalId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des réservants:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer une nouvelle réservation avec réservant (création automatique si n'existe pas)
router.post('/reservation', async (req, res) => {
    const {
        reservant_name, reservant_email, reservant_type, festival_id,
        editor_name, editor_email, // Optionnels pour les réservants de type 'éditeur'
        start_price, nb_prises, final_price,
        table_discount_offered = 0, direct_discount = 0,
        note, phone_number, address, siret,
        represented_editor_id,
        zones_tarifaires = [] // Nouvelle structure pour les zones tarifaires
    } = req.body;

    if (!reservant_name || !reservant_email || !reservant_type || !festival_id || start_price === undefined || nb_prises === undefined || final_price === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let editorId = null;
        let representedEditorId: number | null = null;
        let representedEditorEditorId: number | null = null;

        if (represented_editor_id !== undefined && represented_editor_id !== null && represented_editor_id !== '') {
            const representedEditorIdParsed = Number(represented_editor_id);
            if (!Number.isFinite(representedEditorIdParsed)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Identifiant éditeur représenté invalide' });
            }

            const representedEditorResult = await client.query(
                `SELECT id, editor_id
                 FROM reservant
                 WHERE id = $1 AND type = 'editeur'`,
                [representedEditorIdParsed]
            );

            if (representedEditorResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Éditeur représenté introuvable' });
            }

            representedEditorId = representedEditorIdParsed;
            representedEditorEditorId = representedEditorResult.rows[0].editor_id;

            if (!representedEditorEditorId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Éditeur représenté sans fiche éditeur associée' });
            }
        }

        // 1. Si le réservant est de type 'editeur', créer/récupérer l'éditeur
        if (reservant_type === 'editeur' && editor_name && editor_email) {
            let editorResult = await client.query(
                'SELECT id FROM Editor WHERE email = $1',
                [editor_email]
            );

            if (editorResult.rows.length === 0) {
                // Créer nouvel éditeur
                const newEditor = await client.query(
                    'INSERT INTO Editor (name, email) VALUES ($1, $2) RETURNING id',
                    [editor_name, editor_email]
                );
                editorId = newEditor.rows[0].id;
            } else {
                editorId = editorResult.rows[0].id;
            }
        }

        // 2. Créer ou récupérer le réservant
        let reservantResult = await client.query(
            'SELECT id FROM reservant WHERE email = $1',
            [reservant_email]
        );

        let reservantId;
        if (reservantResult.rows.length === 0) {
            // Créer nouveau réservant
            const newReservant = await client.query(
                `INSERT INTO reservant (name, email, type, editor_id, phone_number, address, siret)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [reservant_name, reservant_email, reservant_type, editorId, phone_number, address, siret]
            );
            reservantId = newReservant.rows[0].id;
        } else {
            reservantId = reservantResult.rows[0].id;
        }

        // 3. Créer le suivi_workflow
        const workflowResult = await client.query(
            `INSERT INTO suivi_workflow (reservant_id, festival_id, state)
             VALUES ($1, $2, 'Pas_de_contact')
             ON CONFLICT (reservant_id, festival_id) 
             DO UPDATE SET state = EXCLUDED.state
             RETURNING id`,
            [reservantId, festival_id]
        );
        const workflowId = workflowResult.rows[0].id;

        // 4. Créer la réservation
        const reservationResult = await client.query(
            `INSERT INTO reservation (
                reservant_id, festival_id, workflow_id,
                start_price, table_discount_offered, direct_discount, 
                nb_prises, final_price, note, represented_editor_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [reservantId, festival_id, workflowId,
                start_price, table_discount_offered, direct_discount,
                nb_prises, final_price, note, representedEditorId]
        );

        const reservationId = reservationResult.rows[0].id;

        // 5. Insérer les relations avec les zones tarifaires et mettre à jour le stock
        let totalChaisesReservees = 0;
        
        if (zones_tarifaires && zones_tarifaires.length > 0) {
            for (const zone of zones_tarifaires) {
                // Vérifier le stock de tables disponible
                const stockCheck = await client.query(
                    `SELECT nb_tables_available FROM zone_tarifaire WHERE id = $1 FOR UPDATE`,
                    [zone.zone_tarifaire_id]
                );

                if (stockCheck.rows.length === 0) {
                    throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} introuvable`);
                }

                const stockDisponible = stockCheck.rows[0].nb_tables_available;
                if (stockDisponible < zone.nb_tables_reservees) {
                    throw new Error(`Stock insuffisant pour la zone tarifaire ${zone.zone_tarifaire_id}. Disponible: ${stockDisponible}, Demandé: ${zone.nb_tables_reservees}`);
                }

                const nbChaises = zone.nb_chaises_reservees || 0;
                totalChaisesReservees += nbChaises;

                // Insérer la réservation de zone tarifaire avec les chaises
                await client.query(
                    `INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees, nb_chaises_reservees)
                     VALUES ($1, $2, $3, $4)`,
                    [reservationId, zone.zone_tarifaire_id, zone.nb_tables_reservees, nbChaises]
                );

                // Mettre à jour le stock de tables disponible
                await client.query(
                    `UPDATE zone_tarifaire 
                     SET nb_tables_available = nb_tables_available - $1 
                     WHERE id = $2`,
                    [zone.nb_tables_reservees, zone.zone_tarifaire_id]
                );
            }
        }

        // Vérifier et mettre à jour le stock de chaises du festival
        if (totalChaisesReservees > 0) {
            const chaisesCheck = await client.query(
                `SELECT stock_chaises_available FROM festival WHERE id = $1 FOR UPDATE`,
                [festival_id]
            );
            
            const chaisesDisponibles = chaisesCheck.rows[0]?.stock_chaises_available || 0;
            if (chaisesDisponibles < totalChaisesReservees) {
                throw new Error(`Stock de chaises insuffisant. Disponible: ${chaisesDisponibles}, Demandé: ${totalChaisesReservees}`);
            }

            await client.query(
                `UPDATE festival 
                 SET stock_chaises_available = stock_chaises_available - $1 
                 WHERE id = $2`,
                [totalChaisesReservees, festival_id]
            );
        }

        // 6. Si le réservant est lié à un éditeur, créer automatiquement les allocations de jeux
        // Récupérer l'editor_id du réservant
        const reservantEditorResult = await client.query(
            'SELECT editor_id FROM reservant WHERE id = $1',
            [reservantId]
        );
        const reservantEditorId = reservantEditorResult.rows[0]?.editor_id;
        const editorIdForGames = representedEditorEditorId || reservantEditorId;

        if (editorIdForGames) {
            // Récupérer tous les jeux de cet éditeur
            const gamesResult = await client.query(
                'SELECT id FROM games WHERE editor_id = $1',
                [editorIdForGames]
            );

            // Créer une allocation pour chaque jeu (nb_exemplaires=1, nb_tables_occupees=1 par défaut)
            for (const game of gamesResult.rows) {
                await client.query(
                    `INSERT INTO jeux_alloues (game_id, reservation_id, nb_tables_occupees, nb_exemplaires, taille_table_requise)
                     VALUES ($1, $2, 1, 1, 'standard')
                     ON CONFLICT (reservation_id, game_id) DO NOTHING`,
                    [game.id, reservationId]
                );
            }

            if (gamesResult.rows.length > 0) {
                console.log(`✅ ${gamesResult.rows.length} jeux auto-alloués pour la réservation ${reservationId} (éditeur ${editorIdForGames})`);
            }
        }

        await client.query('COMMIT');

        // Retourner les données complètes
        const completeResult = await client.query(
            `SELECT 
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
             WHERE r.id = $1`,
            [reservationResult.rows[0].id]
        );

        res.status(201).json({
            message: 'Réservation créée avec succès',
            reservation: completeResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création de la réservation:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
        client.release();
    }
});

//modifier une reservation
router.put('/reservation/:id', async (req, res) => {
    const { id } = req.params;
    const {
        start_price, nb_prises, final_price,
        table_discount_offered, direct_discount,
        note, zones_tarifaires = []
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Récupérer le festival_id de la réservation
        const reservationInfo = await client.query(
            `SELECT festival_id FROM reservation WHERE id = $1`,
            [id]
        );
        if (reservationInfo.rows.length === 0) {
            throw new Error('Réservation introuvable');
        }
        const festivalId = reservationInfo.rows[0].festival_id;

        // 1. Récupérer les anciennes réservations de zones pour restaurer le stock
        const oldZones = await client.query(
            `SELECT zone_tarifaire_id, nb_tables_reservees, nb_chaises_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`,
            [id]
        );

        // Calculer le total des anciennes chaises
        let oldTotalChaises = 0;

        // 2. Restaurer le stock des anciennes zones (tables)
        for (const oldZone of oldZones.rows) {
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`,
                [oldZone.nb_tables_reservees, oldZone.zone_tarifaire_id]
            );
            oldTotalChaises += oldZone.nb_chaises_reservees || 0;
        }

        // 2b. Restaurer le stock de chaises du festival
        if (oldTotalChaises > 0) {
            await client.query(
                `UPDATE festival 
                 SET stock_chaises_available = stock_chaises_available + $1 
                 WHERE id = $2`,
                [oldTotalChaises, festivalId]
            );
        }

        // 3. Supprimer les anciennes associations
        await client.query(
            `DELETE FROM reservation_zones_tarifaires WHERE reservation_id = $1`,
            [id]
        );

        // 4. Mettre à jour la réservation
        const updateResult = await client.query(
            `UPDATE reservation
                SET start_price = $1,
                    nb_prises = $2,
                    final_price = $3,
                    table_discount_offered = $4,
                    direct_discount = $5,
                    note = $6
                WHERE id = $7
                RETURNING *`,
            [start_price, nb_prises, final_price,
                table_discount_offered, direct_discount,
                note, id]
        );

        // 5. Ajouter les nouvelles zones et décrémenter le stock
        let newTotalChaises = 0;

        for (const zone of zones_tarifaires) {
            // Vérifier le stock de tables disponible
            const stockCheck = await client.query(
                `SELECT nb_tables_available FROM zone_tarifaire WHERE id = $1 FOR UPDATE`,
                [zone.zone_tarifaire_id]
            );

            if (stockCheck.rows.length === 0) {
                throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} introuvable`);
            }

            const stockDisponible = stockCheck.rows[0].nb_tables_available;
            if (stockDisponible < zone.nb_tables_reservees) {
                throw new Error(`Stock insuffisant pour la zone tarifaire ${zone.zone_tarifaire_id}. Disponible: ${stockDisponible}, Demandé: ${zone.nb_tables_reservees}`);
            }

            const nbChaises = zone.nb_chaises_reservees || 0;
            newTotalChaises += nbChaises;

            // Insérer la nouvelle réservation de zone avec les chaises
            await client.query(
                `INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees, nb_chaises_reservees)
                 VALUES ($1, $2, $3, $4)`,
                [id, zone.zone_tarifaire_id, zone.nb_tables_reservees, nbChaises]
            );

            // Décrémenter le stock de tables
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available - $1 
                 WHERE id = $2`,
                [zone.nb_tables_reservees, zone.zone_tarifaire_id]
            );
        }

        // 5b. Vérifier et mettre à jour le stock de chaises du festival
        if (newTotalChaises > 0) {
            const chaisesCheck = await client.query(
                `SELECT stock_chaises_available FROM festival WHERE id = $1 FOR UPDATE`,
                [festivalId]
            );
            
            const chaisesDisponibles = chaisesCheck.rows[0]?.stock_chaises_available || 0;
            if (chaisesDisponibles < newTotalChaises) {
                throw new Error(`Stock de chaises insuffisant. Disponible: ${chaisesDisponibles}, Demandé: ${newTotalChaises}`);
            }

            await client.query(
                `UPDATE festival 
                 SET stock_chaises_available = stock_chaises_available - $1 
                 WHERE id = $2`,
                [newTotalChaises, festivalId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Réservation mise à jour avec succès', reservation: updateResult.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la mise à jour de la réservation:', err);
        res.status(500).json({
            error: 'Erreur serveur',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    } finally {
        client.release();
    }
});

// Supprimer une réservation et restaurer le stock
router.delete('/reservation/:id', async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Récupérer le festival_id de la réservation
        const reservationInfo = await client.query(
            `SELECT festival_id FROM reservation WHERE id = $1`,
            [id]
        );
        if (reservationInfo.rows.length === 0) {
            throw new Error('Réservation introuvable');
        }
        const festivalId = reservationInfo.rows[0].festival_id;

        // 2. Récupérer les zones tarifaires de la réservation pour restaurer le stock
        const zonesToRestore = await client.query(
            `SELECT zone_tarifaire_id, nb_tables_reservees, nb_chaises_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`,
            [id]
        );

        // 3. Restaurer le stock des zones tarifaires et calculer les chaises
        let totalChaisesToRestore = 0;
        for (const zone of zonesToRestore.rows) {
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`,
                [zone.nb_tables_reservees, zone.zone_tarifaire_id]
            );
            totalChaisesToRestore += zone.nb_chaises_reservees || 0;
        }

        // 3b. Restaurer le stock de chaises du festival
        if (totalChaisesToRestore > 0) {
            await client.query(
                `UPDATE festival 
                 SET stock_chaises_available = stock_chaises_available + $1 
                 WHERE id = $2`,
                [totalChaisesToRestore, festivalId]
            );
        }

        // 4. Supprimer les associations zones tarifaires
        await client.query(
            `DELETE FROM reservation_zones_tarifaires WHERE reservation_id = $1`,
            [id]
        );

        // 5. Supprimer la réservation
        const deleteResult = await client.query(
            `DELETE FROM reservation WHERE id = $1 RETURNING *`,
            [id]
        );

        if (deleteResult.rows.length === 0) {
            throw new Error('Réservation introuvable');
        }

        await client.query('COMMIT');
        res.json({
            message: 'Réservation supprimée avec succès',
            reservation: deleteResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la suppression de la réservation:', err);
        res.status(500).json({
            error: 'Erreur serveur',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    } finally {
        client.release();
    }
});

export default router;

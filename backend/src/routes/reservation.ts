import { Router } from 'express'
import pool from '../db/database.js'
import { calculerPrixBrutReservation } from '../services/reservation-calculator.js';
import { verifierStockDisponible } from '../services/stock-checker.js';

const router = Router();
const M2_PAR_TABLE = 4;
// Route pour consulter le stock disponible d'un festival
router.get('/stock/:festivalId', async (req, res) => {
    const { festivalId } = req.params;

    try {
        const { rows } = await pool.query(
            `SELECT 
                zt.id,
                zt.name,
                zt.nb_tables as total_tables,
                zt.nb_tables_available as available_tables,
                (zt.nb_tables - zt.nb_tables_available) as reserved_tables,
                zt.price_per_table,
                zt.m2_price 
             FROM zone_tarifaire zt
             WHERE zt.festival_id = $1
             ORDER BY zt.name`,
            [festivalId]
        );

        res.json(rows);
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
             ORDER BY sw.state, res.name`,
            [festivalId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des réservations:', err);
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
// Créer une nouvelle réservation avec réservant
router.post('/reservation', async (req, res) => {
  console.log('📥 Requête reçue:', req.body);
  
  const {
    reservant_name, reservant_email, reservant_type, festival_id,
    editor_name, editor_email,
    // SUPPRIMÉ : start_price, nb_prises, final_price (calculés automatiquement)
    table_discount_offered = 0, direct_discount = 0,
    note, phone_number, address, siret,
    zones = []  // ← NOUVEAU : tableau de zones avec détails
  } = req.body;

  // Validation
  if (!reservant_name || !reservant_email || !reservant_type || !festival_id) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  if (!zones || zones.length === 0) {
    return res.status(400).json({ 
      error: 'Au moins une zone tarifaire avec tables/chaises est requise' 
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. RÉCUPÉRER LES ZONES TARIFAIRES
    const { rows: zonesTarifaires } = await client.query(
      `SELECT id, price_per_table, m2_price, nb_tables_available 
       FROM zone_tarifaire 
       WHERE festival_id = $1`,
      [festival_id]
    );

    if (zonesTarifaires.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Aucune zone tarifaire disponible pour ce festival' 
      });
    }

    console.log('📍 Zones tarifaires disponibles:', zonesTarifaires);

    // 2. CALCULER LE PRIX AUTOMATIQUEMENT (NOUVEAU)
    let prixBrut;
    let totalChaises;

    try {
        const result = calculerPrixBrutReservation(zones, zonesTarifaires);
        prixBrut = result.prixTotal;
        totalChaises = result.totalChaises;
    } catch (calcError) {
        await client.query('ROLLBACK');
        const errorMessage = calcError instanceof Error ? calcError.message : 'Erreur de calcul du prix';
        return res.status(400).json({ error: errorMessage });
    }

    console.log('💰 Prix brut calculé:', prixBrut, 'Chaises:', totalChaises);

    // 2bis. VÉRIFIER LE STOCK DISPONIBLE (AJOUTEZ ICI)
    const verificationStock = verifierStockDisponible(zones, zonesTarifaires);
    if (!verificationStock.success) {
        await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Stock insuffisant', 
                details: verificationStock.message 
    });
    }

    // 3. CODE EXISTANT POUR RÉSERVANT (inchangé)
    let editorId = null;

    if (reservant_type === 'editeur' && editor_name && editor_email) {
      let editorResult = await client.query(
        'SELECT id FROM Editor WHERE email = $1',
        [editor_email]
      );

      if (editorResult.rows.length === 0) {
        const newEditor = await client.query(
          'INSERT INTO Editor (name, email) VALUES ($1, $2) RETURNING id',
          [editor_name, editor_email]
        );
        editorId = newEditor.rows[0].id;
      } else {
        editorId = editorResult.rows[0].id;
      }
    }

    // Créer ou récupérer le réservant
    let reservantResult = await client.query(
      'SELECT id FROM reservant WHERE email = $1',
      [reservant_email]
    );

    let reservantId;
    if (reservantResult.rows.length === 0) {
      const newReservant = await client.query(
        `INSERT INTO reservant (name, email, type, editor_id, phone_number, address, siret)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [reservant_name, reservant_email, reservant_type, editorId, 
         phone_number, address, siret]
      );
      reservantId = newReservant.rows[0].id;
    } else {
      reservantId = reservantResult.rows[0].id;
    }

    // 4. Créer le suivi_workflow
    const workflowResult = await client.query(
      `INSERT INTO suivi_workflow (reservant_id, festival_id, state)
       VALUES ($1, $2, 'Pas_de_contact')
       ON CONFLICT (reservant_id, festival_id) 
       DO UPDATE SET state = EXCLUDED.state
       RETURNING id`,
      [reservantId, festival_id]
    );
    const workflowId = workflowResult.rows[0].id;

    // 5. CRÉER LA RÉSERVATION AVEC PRIX CALCULÉ
    const reservationResult = await client.query(
      `INSERT INTO reservation (
        reservant_id, festival_id, workflow_id,
        start_price, table_discount_offered, direct_discount, 
        nb_prises, final_price, note, nb_chaises_reservees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        reservantId, 
        festival_id, 
        workflowId,
        prixBrut,       // ← start_price = calculé automatiquement
        0,              // ← table_discount_offered = 0 (remise plus tard)
        0,              // ← direct_discount = 0 (remise plus tard)
        1,              // ← nb_prises = 1 par défaut
        prixBrut,       // ← final_price = start_price initialement
        note || '',
        totalChaises    // ← chaises calculées
      ]
    );

    const reservationId = reservationResult.rows[0].id;
    console.log('✅ Réservation créée ID:', reservationId);

    // 6. INSÉRER LES ZONES DANS reservation_zones_tarifaires
    for (const zone of zones) {
      // Calculer le prix de cette zone spécifique
      let prixZone = 0;
      const zoneTarifaire = zonesTarifaires.find(z => z.id === zone.zone_tarifaire_id);
      
      if (zone.mode_paiement === 'table') {
        const totalTables = 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
        prixZone = totalTables * zoneTarifaire.price_per_table;
      } else {
        prixZone = (zone.surface_m2 || 0) * zoneTarifaire.m2_price;
      }

      await client.query(
        `INSERT INTO reservation_zones_tarifaires (
          reservation_id, zone_tarifaire_id, mode_paiement,
          nb_tables_standard, nb_tables_grande, nb_tables_mairie, 
          nb_chaises, surface_m2, prix_calcule
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          reservationId,
          zone.zone_tarifaire_id,
          zone.mode_paiement || 'table',
          zone.nb_tables_standard || 0,
          zone.nb_tables_grande || 0,
          zone.nb_tables_mairie || 0,
          zone.nb_chaises || 0,
          zone.surface_m2 || 0,
          prixZone
        ]
      );

      // 7. VÉRIFIER ET METTRE À JOUR LE STOCK
      const stockCheck = await client.query(
        `SELECT nb_tables_available FROM zone_tarifaire WHERE id = $1 FOR UPDATE`,
        [zone.zone_tarifaire_id]
      );

      if (stockCheck.rows.length === 0) {
        throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} introuvable`);
      }

      // Calculer tables réservées
      let tablesReservees = 0;
      if (zone.mode_paiement === 'table') {
        tablesReservees = (zone.nb_tables_standard || 0) + 
                         (zone.nb_tables_grande || 0) + 
                         (zone.nb_tables_mairie || 0);
      } else {
        // Mode m² : convertir en tables équivalentes (arrondi au supérieur)
        tablesReservees = Math.ceil((zone.surface_m2 || 0) / M2_PAR_TABLE);
      }

      const stockDisponible = stockCheck.rows[0].nb_tables_available;
      if (stockDisponible < tablesReservees) {
        throw new Error(`Stock insuffisant dans la zone "${zoneTarifaire?.name}". Disponible: ${stockDisponible}, Demandé: ${tablesReservees}`);
      }

      // Mettre à jour le stock
      await client.query(
        `UPDATE zone_tarifaire 
         SET nb_tables_available = nb_tables_available - $1 
         WHERE id = $2`,
        [tablesReservees, zone.zone_tarifaire_id]
      );
      
      console.log(`📉 Stock mis à jour: -${tablesReservees} tables pour zone ${zone.zone_tarifaire_id}`);
    }

    await client.query('COMMIT');

    // 8. RÉPONSE
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
      [reservationId]
    );

    res.status(201).json({
      message: 'Réservation créée avec succès',
      reservation: completeResult.rows[0],
      prix_calcule: prixBrut,
      total_chaises: totalChaises
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('💥 Erreur création réservation:', err);
    
    if (err instanceof Error && err.message.includes('duplicate key')) {
      return res.status(409).json({ 
        error: 'Ce réservant a déjà une réservation pour ce festival' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la réservation',
      details: err instanceof Error ? err.message : 'Erreur inconnue' 
    });
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
        // 1. Récupérer les anciennes réservations de zones pour restaurer le stock
        const oldZones = await client.query(
            `SELECT zone_tarifaire_id, nb_tables_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`,
            [id]
        );

        // 2. Restaurer le stock des anciennes zones
        for (const oldZone of oldZones.rows) {
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`,
                [oldZone.nb_tables_reservees, oldZone.zone_tarifaire_id]
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
        for (const zone of zones_tarifaires) {
            // Vérifier le stock disponible
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

            // Insérer la nouvelle réservation de zone
            await client.query(
                `INSERT INTO reservation_zones_tarifaires (reservation_id, zone_tarifaire_id, nb_tables_reservees)
                 VALUES ($1, $2, $3)`,
                [id, zone.zone_tarifaire_id, zone.nb_tables_reservees]
            );

            // Décrémenter le stock
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available - $1 
                 WHERE id = $2`,
                [zone.nb_tables_reservees, zone.zone_tarifaire_id]
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

        // 1. Récupérer les zones tarifaires de la réservation pour restaurer le stock
        const zonesToRestore = await client.query(
            `SELECT zone_tarifaire_id, nb_tables_reservees 
             FROM reservation_zones_tarifaires 
             WHERE reservation_id = $1`,
            [id]
        );

        // 2. Restaurer le stock des zones tarifaires
        for (const zone of zonesToRestore.rows) {
            await client.query(
                `UPDATE zone_tarifaire 
                 SET nb_tables_available = nb_tables_available + $1 
                 WHERE id = $2`,
                [zone.nb_tables_reservees, zone.zone_tarifaire_id]
            );
        }

        // 3. Supprimer les associations zones tarifaires
        await client.query(
            `DELETE FROM reservation_zones_tarifaires WHERE reservation_id = $1`,
            [id]
        );

        // 4. Supprimer la réservation
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

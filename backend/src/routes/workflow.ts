import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Recupere le suivi d'un workflow par l'id de la réservation
router.get('/reservation/:reservationId', async (req, res) => {
    const { reservationId } = req.params;
    try {
        // D'abord récupérer le workflow_id depuis la réservation
        const reservationResult = await pool.query(
            'SELECT workflow_id FROM reservation WHERE id = $1',
            [reservationId]
        );
        
        if (reservationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Réservation non trouvée' });
        }
        
        const workflowId = reservationResult.rows[0].workflow_id;
        if (!workflowId) {
            return res.status(404).json({ error: 'Aucun workflow associé à cette réservation' });
        }
        
        // Ensuite récupérer le workflow
        const { rows } = await pool.query(
            `SELECT 
                sw.id,
                sw.reservant_id,
                sw.festival_id,
                sw.state as etatcourant,
                sw.liste_jeux_demandee,
                sw.liste_jeux_obtenue,
                sw.jeux_recus,
                sw.presentera_jeux,
                COALESCE(
                    (SELECT array_agg(sc.date_contact ORDER BY sc.date_contact DESC) 
                     FROM suivi_contact sc 
                     WHERE sc.workflow_id = sw.id), 
                    '{}'
                ) as contact_dates
            FROM suivi_workflow sw
            WHERE sw.id = $1`, 
            [workflowId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Workflow non trouvé' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération du workflow:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Met à jour le suivi d'un workflow par son id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { state, liste_jeux_demandee, liste_jeux_obtenue, jeux_recus, presentera_jeux } = req.body;
    
    try {
        const { rows } = await pool.query(
            `UPDATE suivi_workflow 
            SET state = $1,
                liste_jeux_demandee = $2,
                liste_jeux_obtenue = $3,
                jeux_recus = $4,
                presentera_jeux = $5
            WHERE id = $6
            RETURNING id, reservant_id, festival_id, state as etatcourant, 
                      liste_jeux_demandee, liste_jeux_obtenue, jeux_recus, presentera_jeux`,
            [state, liste_jeux_demandee, liste_jeux_obtenue, jeux_recus, presentera_jeux, id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Workflow non trouvé' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du workflow:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajoute une date de contact au workflow
router.post('/:id/contact', async (req, res) => {
    const { id } = req.params;
    try {
        // Vérifier si un contact a déjà été enregistré aujourd'hui
        const existingContact = await pool.query(
            `SELECT id FROM suivi_contact 
             WHERE workflow_id = $1 
             AND DATE(date_contact) = CURRENT_DATE`,
            [id]
        );
        
        if (existingContact.rows.length > 0) {
            return res.status(409).json({ error: 'Un contact a déjà été enregistré aujourd\'hui' });
        }
        
        // Insert into suivi_contact
        await pool.query(
            `INSERT INTO suivi_contact (workflow_id, date_contact) VALUES ($1, NOW())`,
            [id]
        );
        
        // Return updated list of dates
        const { rows } = await pool.query(
            `SELECT date_contact FROM suivi_contact WHERE workflow_id = $1 ORDER BY date_contact DESC`,
            [id]
        );
        
        res.json(rows.map(r => r.date_contact));
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la date de contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
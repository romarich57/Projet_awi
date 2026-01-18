// Role : Gerer les routes liees aux reservants et contacts.
import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Role : Garantir l'existence d'un workflow pour un reservant.
// Preconditions : reservantId est valide, festivalId est optionnel.
// Postconditions : Retourne l'id du workflow existant ou cree.
async function ensureWorkflow(reservantId: number, festivalId?: number) {
    let targetFestivalId = festivalId;
    if (!targetFestivalId) {
        const { rows: festivalRows } = await pool.query('SELECT id FROM festival ORDER BY id ASC LIMIT 1');
        if (festivalRows.length === 0) {
            throw new Error('Aucun festival disponible pour créer un workflow');
        }
        targetFestivalId = festivalRows[0].id;
    }

    const { rows: existing } = await pool.query(
        'SELECT id FROM suivi_workflow WHERE reservant_id = $1 ORDER BY id DESC LIMIT 1',
        [reservantId],
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const { rows: created } = await pool.query(
        `INSERT INTO suivi_workflow (reservant_id, festival_id, state)
         VALUES ($1, $2, 'Pas_de_contact')
         RETURNING id`,
        [reservantId, targetFestivalId],
    );

    return created[0].id;
}

// Role : Lister tous les reservants.
// Preconditions : Aucune.
// Postconditions : Retourne la liste des reservants.
router.get('/', async (_req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, type, editor_id, phone_number, address, siret, notes FROM reservant ORDER BY name ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des réservants:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Obtenir le detail d'un reservant.
// Preconditions : id est valide.
// Postconditions : Retourne le reservant ou une erreur.
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, type, editor_id, phone_number, address, siret, notes FROM reservant WHERE id = $1',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Réservant non trouvé' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération du réservant:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Creer un reservant.
// Preconditions : name, email, type sont fournis.
// Postconditions : Cree le reservant ou retourne une erreur.
router.post('/', async (req, res) => {
    const { name, email, type, editor_id, phone_number, address, siret, notes } = req.body;

    if (!name || !email || !type) {
        return res.status(400).json({ error: 'Champs obligatoires manquants (name, email, type)' });
    }

    // Vérifier que type est valide
    const validTypes = ['editeur', 'prestataire', 'boutique', 'animateur', 'association'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type invalide. Valeurs autorisées: editeur, prestataire, boutique, animateur, association' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO reservant (name, email, type, editor_id, phone_number, address, siret, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, email, type, editor_id, phone_number, address, siret, notes`,
            [name, email, type, editor_id || null, phone_number || null, address || null, siret || null, notes || null]
        );
        res.status(201).json(rows[0]);
    } catch (err: any) {
        console.error('Erreur lors de la création du réservant:', err);
        // Gestion de l'erreur d'email unique
        if (err.code === '23505' && err.constraint === 'reservant_email_key') {
            return res.status(409).json({ error: 'Un réservant avec cet email existe déjà' });
        }
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// Role : Mettre a jour un reservant.
// Preconditions : id est valide, payload coherent.
// Postconditions : Met a jour le reservant ou retourne une erreur.
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, type, editor_id, phone_number, address, siret, notes } = req.body;

    try {
        const { rows, rowCount } = await pool.query(
            `UPDATE reservant
             SET name = $1, email = $2, type = $3, editor_id = $4, phone_number = $5, address = $6, siret = $7, notes = $8
             WHERE id = $9
             RETURNING id, name, email, type, editor_id, phone_number, address, siret, notes`,
            [name, email, type, editor_id || null, phone_number || null, address || null, siret || null, notes || null, id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Réservant non trouvé' });
        }

        res.json(rows[0]);
    } catch (err: any) {
        console.error('Erreur lors de la mise à jour du réservant:', err);
        // Gestion de l'erreur d'email unique
        if (err.code === '23505' && err.constraint === 'reservant_email_key') {
            return res.status(409).json({ error: 'Un réservant avec cet email existe déjà' });
        }
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// Role : Supprimer un reservant.
// Preconditions : id est valide.
// Postconditions : Supprime le reservant ou retourne une erreur.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await pool.query(
            'DELETE FROM reservant WHERE id = $1',
            [id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Réservant non trouvé' });
        }

        res.json({ message: 'Réservant supprimé avec succès' });
    } catch (err: any) {
        console.error('Erreur lors de la suppression du réservant:', err);
        // Gestion des contraintes de clé étrangère
        if (err.code === '23503') {
            return res.status(409).json({
                error: 'Impossible de supprimer ce réservant car il est référencé par d\'autres entités (contacts, workflows, réservations)'
            });
        }
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// Role : Mettre a jour l'etat de workflow d'un reservant (R3).
// Preconditions : id est valide, workflowState autorise.
// Postconditions : Met a jour le workflow et retourne le reservant.
router.patch('/:id/workflow', async (req, res) => {
    const { id } = req.params;
    const { workflowState, festivalId } = req.body;

    const validStates = [
        'Pas_de_contact',
        'Contact_pris',
        'Discussion_en_cours',
        'Sera_absent',
        'Considere_absent',
        'Reservation_confirmee',
        'Facture',
        'Facture_payee',
    ];

    if (!validStates.includes(workflowState)) {
        return res.status(400).json({ error: 'Etat de workflow invalide' });
    }

    try {
        const workflowId = await ensureWorkflow(Number(id), festivalId);
        await pool.query(
            'UPDATE suivi_workflow SET state = $1 WHERE id = $2',
            [workflowState, workflowId],
        );

        const { rows } = await pool.query(
            `SELECT r.id, r.name, r.email, r.type, r.editor_id, r.phone_number, r.address, r.siret, r.notes,
                    sw.state AS workflow_state, sw.liste_jeux_demandee, sw.liste_jeux_obtenue, sw.jeux_recus, sw.presentera_jeux
             FROM reservant r
             LEFT JOIN suivi_workflow sw ON sw.reservant_id = r.id
             WHERE r.id = $1
             ORDER BY sw.id DESC
             LIMIT 1`,
            [id],
        );

        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du workflow:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Mettre a jour les indicateurs de workflow (R3).
// Preconditions : id est valide.
// Postconditions : Met a jour les flags et retourne le reservant.
router.patch('/:id/workflow/flags', async (req, res) => {
    const { id } = req.params;
    const { liste_jeux_demandee, liste_jeux_obtenue, jeux_recus, presentera_jeux, festivalId } = req.body;

    try {
        const workflowId = await ensureWorkflow(Number(id), festivalId);
        await pool.query(
            `UPDATE suivi_workflow
             SET liste_jeux_demandee = COALESCE($1, liste_jeux_demandee),
                 liste_jeux_obtenue = COALESCE($2, liste_jeux_obtenue),
                 jeux_recus = COALESCE($3, jeux_recus),
                 presentera_jeux = COALESCE($4, presentera_jeux)
             WHERE id = $5`,
            [liste_jeux_demandee, liste_jeux_obtenue, jeux_recus, presentera_jeux, workflowId],
        );

        const { rows } = await pool.query(
            `SELECT r.id, r.name, r.email, r.type, r.editor_id, r.phone_number, r.address, r.siret, r.notes,
                    sw.state AS workflow_state, sw.liste_jeux_demandee, sw.liste_jeux_obtenue, sw.jeux_recus, sw.presentera_jeux
             FROM reservant r
             LEFT JOIN suivi_workflow sw ON sw.reservant_id = r.id
             WHERE r.id = $1
             ORDER BY sw.id DESC
             LIMIT 1`,
            [id],
        );

        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la mise à jour des flags de workflow:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Lister les contacts d'un reservant (R2).
// Preconditions : id est valide.
// Postconditions : Retourne la liste des contacts.
router.get('/:id/contacts', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT id, name, email, phone_number, job_title, priority
             FROM contact
             WHERE reservant_id = $1
             ORDER BY priority ASC, name ASC`,
            [id],
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des contacts:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Ajouter un contact pour un reservant (R2).
// Preconditions : Champs obligatoires fournis.
// Postconditions : Cree le contact et retourne les donnees.
router.post('/:id/contacts', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone_number, job_title, priority } = req.body;

    if (!name || !email || !phone_number || !job_title || priority === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants pour le contact' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO contact (name, email, phone_number, job_title, reservant_id, priority)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, email, phone_number, job_title, priority`,
            [name, email, phone_number, job_title, id, priority],
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la création du contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Recuperer la timeline des contacts (R2).
// Preconditions : id est valide.
// Postconditions : Retourne la timeline des contacts.
router.get('/:id/contacts/timeline', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT sc.id,
                    c.id as contact_id,
                    sw.reservant_id,
                    sw.festival_id,
                    c.name as contact_name,
                    c.email as contact_email,
                    c.phone_number as contact_phone_number,
                    c.job_title as contact_job_title,
                    c.priority as contact_priority,
                    sc.date_contact
             FROM suivi_contact sc
             JOIN contact c ON sc.contact_id = c.id
             JOIN suivi_workflow sw ON sc.workflow_id = sw.id
             WHERE sw.reservant_id = $1
             ORDER BY sc.date_contact DESC`,
            [id],
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération de la timeline des contacts:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Ajouter un evenement de contact dans la timeline (R2).
// Preconditions : contactId est fourni, id est valide.
// Postconditions : Cree l'evenement et retourne les donnees.
router.post('/:id/contacts/events', async (req, res) => {
    const { id } = req.params;
    const { contactId, dateContact } = req.body;

    if (!contactId) {
        return res.status(400).json({ error: 'contactId requis' });
    }

    try {
        const { rows: workflowRows } = await pool.query(
            'SELECT id, festival_id FROM suivi_workflow WHERE reservant_id = $1 ORDER BY id DESC LIMIT 1',
            [id],
        );

        if (workflowRows.length === 0) {
            return res.status(404).json({ error: 'Workflow introuvable pour enregistrer le contact' });
        }

        const workflowId = workflowRows[0].id;
        const contactDate = dateContact ? new Date(dateContact) : new Date();

        const { rows: inserted } = await pool.query(
            `INSERT INTO suivi_contact (contact_id, workflow_id, date_contact)
             VALUES ($1, $2, $3)
             RETURNING id, contact_id, workflow_id, date_contact`,
            [contactId, workflowId, contactDate],
        );

        const { rows } = await pool.query(
            `SELECT sc.id,
                    c.id as contact_id,
                    sw.reservant_id,
                    sw.festival_id,
                    c.name as contact_name,
                    c.email as contact_email,
                    c.phone_number as contact_phone_number,
                    c.job_title as contact_job_title,
                    c.priority as contact_priority,
                    sc.date_contact
             FROM suivi_contact sc
             JOIN contact c ON sc.contact_id = c.id
             JOIN suivi_workflow sw ON sc.workflow_id = sw.id
             WHERE sc.id = $1`,
            [inserted[0].id],
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de l\'ajout d\'un événement de contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Supprimer un contact (R2).
// Preconditions : id et contactId sont valides.
// Postconditions : Supprime le contact ou retourne une erreur.
router.delete('/:id/contacts/:contactId', async (req, res) => {
    const { id, contactId } = req.params;
    try {
        // Vérifier que le contact appartient bien au réservant
        const { rowCount } = await pool.query(
            'DELETE FROM contact WHERE id = $1 AND reservant_id = $2',
            [contactId, id],
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Contact introuvable pour ce réservant' });
        }
        res.json({ message: 'Contact supprimé' });
    } catch (err) {
        console.error('Erreur lors de la suppression du contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Role : Supprimer un evenement de contact (timeline) (R2).
// Preconditions : id et eventId sont valides.
// Postconditions : Supprime l'evenement ou retourne une erreur.
router.delete('/:id/contacts/events/:eventId', async (req, res) => {
    const { id, eventId } = req.params;
    try {
        // Vérifier que l'événement appartient bien au réservant
        const { rows } = await pool.query(
            `SELECT sc.id
             FROM suivi_contact sc
             JOIN suivi_workflow sw ON sc.workflow_id = sw.id
             WHERE sc.id = $1 AND sw.reservant_id = $2`,
            [eventId, id],
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Evénement de contact introuvable pour ce réservant' });
        }

        await pool.query('DELETE FROM suivi_contact WHERE id = $1', [eventId]);
        res.json({ message: 'Evénement supprimé' });
    } catch (err) {
        console.error('Erreur lors de la suppression d\'un événement de contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;

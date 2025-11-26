import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

// Liste de tous les réservants
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

// Détails d'un réservant par ID
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

// Création d'un nouveau réservant
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

// Mise à jour d'un réservant par ID
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

// Suppression d'un réservant par ID
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

export default router;

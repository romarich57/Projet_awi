import { Router } from 'express'
import pool from '../db/database.js'

const router = Router();

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
    const { name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date} = req.body
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
    const { name, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises, start_date, end_date} = req.body
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

export default router

import { Router } from 'express'
import pool from '../db/database.js'

const router = Router()

const allocationSelect = `
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
`

function parseUpdate(body: any): { errors: string[]; sets: string[]; params: any[] } {
  const errors: string[] = []
  const sets: string[] = []
  const params: any[] = []

  if (body.nb_exemplaires !== undefined) {
    const value = Number(body.nb_exemplaires)
    if (!Number.isFinite(value) || value <= 0) {
      errors.push('nb_exemplaires doit être positif')
    } else {
      params.push(value)
      sets.push(`nb_exemplaires = $${params.length}`)
    }
  }

  if (body.nb_tables_occupees !== undefined) {
    const value = Number(body.nb_tables_occupees)
    if (!Number.isFinite(value) || value <= 0) {
      errors.push('nb_tables_occupees doit être positif')
    } else {
      params.push(value)
      sets.push(`nb_tables_occupees = $${params.length}`)
    }
  }

  if (body.zone_plan_id !== undefined) {
    const value =
      body.zone_plan_id === null || body.zone_plan_id === '' ? null : Number(body.zone_plan_id)
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      errors.push('zone_plan_id invalide')
    } else {
      params.push(value)
      sets.push(`zone_plan_id = $${params.length}`)
    }
  }

  if (body.taille_table_requise !== undefined) {
    const allowed = ['standard', 'grande', 'mairie']
    if (!allowed.includes(body.taille_table_requise)) {
      errors.push('taille_table_requise invalide')
    } else {
      params.push(body.taille_table_requise)
      sets.push(`taille_table_requise = $${params.length}`)
    }
  }

  return { errors, sets, params }
}

router.patch('/:id', async (req, res) => {
  const allocationId = Number(req.params.id)
  if (!Number.isFinite(allocationId)) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  const { errors, sets, params } = parseUpdate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Payload invalide', details: errors })
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })
  }

  try {
    const result = await pool.query(
      `UPDATE jeux_alloues SET ${sets.join(', ')} WHERE id = $${params.length + 1} RETURNING id`,
      [...params, allocationId],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Allocation introuvable' })
    }

    const { rows } = await pool.query(
      `${allocationSelect} WHERE ja.id = $1
       GROUP BY
         ja.id, ja.reservation_id, ja.game_id, ja.nb_tables_occupees, ja.nb_exemplaires,
         ja.zone_plan_id, ja.taille_table_requise,
         g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors,
         g.min_players, g.max_players, g.prototype, g.duration_minutes, g.theme,
         g.description, g.image_url, g.rules_video_url`,
      [allocationId],
    )
    res.json(rows[0])
  } catch (err) {
    console.error('Erreur lors de la mise à jour de jeux_alloues', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  const allocationId = Number(req.params.id)
  if (!Number.isFinite(allocationId)) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM jeux_alloues WHERE id = $1', [allocationId])
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Allocation introuvable' })
    }
    res.json({ message: 'Jeu retiré de la réservation' })
  } catch (err) {
    console.error('Erreur lors de la suppression de jeux_alloues', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

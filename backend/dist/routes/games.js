import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();
function toNullableInt(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string' && value.trim().length > 0) {
        const num = Number(value.trim());
        return Number.isFinite(num) ? num : undefined;
    }
    return undefined;
}
function toNullableString(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return undefined;
}
function toBoolean(value) {
    if (value === undefined)
        return undefined;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'oui', 'yes'].includes(normalized))
            return true;
        if (['false', '0', 'non', 'no'].includes(normalized))
            return false;
    }
    return undefined;
}
function parseMechanismIds(value) {
    if (value === undefined)
        return undefined;
    if (!Array.isArray(value))
        return undefined;
    const ids = value
        .map((item) => Number(item))
        .filter((num) => Number.isFinite(num))
        .map((num) => Math.trunc(num));
    return Array.from(new Set(ids));
}
function parseGameBody(body, requireBasics) {
    const errors = [];
    const data = {};
    const title = toNullableString(body?.title);
    const type = toNullableString(body?.type);
    const authors = toNullableString(body?.authors);
    const theme = toNullableString(body?.theme);
    const description = toNullableString(body?.description);
    const imageUrl = toNullableString(body?.image_url);
    const rulesVideoUrl = toNullableString(body?.rules_video_url);
    const editorId = toNullableInt(body?.editor_id);
    const minAge = toNullableInt(body?.min_age);
    const minPlayers = toNullableInt(body?.min_players);
    const maxPlayers = toNullableInt(body?.max_players);
    const durationMinutes = toNullableInt(body?.duration_minutes);
    const prototype = toBoolean(body?.prototype);
    const mechanismIds = parseMechanismIds(body?.mechanismIds);
    if (title !== undefined)
        data.title = title ?? '';
    if (type !== undefined)
        data.type = type ?? '';
    if (authors !== undefined)
        data.authors = authors ?? '';
    if (theme !== undefined)
        data.theme = theme;
    if (description !== undefined)
        data.description = description;
    if (imageUrl !== undefined)
        data.image_url = imageUrl;
    if (rulesVideoUrl !== undefined)
        data.rules_video_url = rulesVideoUrl;
    if (editorId !== undefined)
        data.editor_id = editorId;
    if (minAge !== undefined)
        data.min_age = minAge ?? 0;
    if (minPlayers !== undefined)
        data.min_players = minPlayers;
    if (maxPlayers !== undefined)
        data.max_players = maxPlayers;
    if (durationMinutes !== undefined)
        data.duration_minutes = durationMinutes;
    if (prototype !== undefined)
        data.prototype = prototype;
    if (mechanismIds !== undefined)
        data.mechanismIds = mechanismIds;
    if (requireBasics) {
        if (!title)
            errors.push('title est requis');
        if (!type)
            errors.push('type est requis');
        if (minAge === undefined || minAge === null)
            errors.push('min_age est requis');
        if (!authors)
            errors.push('authors est requis');
        if (editorId === undefined || editorId === null)
            errors.push('editor_id est requis');
    }
    if (minAge !== undefined && (minAge === null || minAge < 0)) {
        errors.push('min_age doit être positif');
    }
    if (minPlayers !== undefined && minPlayers !== null && minPlayers < 1) {
        errors.push('min_players doit être supérieur ou égal à 1');
    }
    if (maxPlayers !== undefined && maxPlayers !== null && maxPlayers < 1) {
        errors.push('max_players doit être supérieur ou égal à 1');
    }
    if (minPlayers !== undefined &&
        maxPlayers !== undefined &&
        minPlayers !== null &&
        maxPlayers !== null &&
        minPlayers > maxPlayers) {
        errors.push('min_players ne peut pas être supérieur à max_players');
    }
    if (durationMinutes !== undefined && durationMinutes !== null && durationMinutes < 0) {
        errors.push('duration_minutes doit être positif');
    }
    return { data, errors };
}
function buildFilters(query) {
    const filters = [];
    const params = [];
    if (query.title) {
        params.push(`%${query.title.toString().toLowerCase()}%`);
        filters.push(`LOWER(g.title) LIKE $${params.length}`);
    }
    if (query.type) {
        params.push(query.type.toString());
        filters.push(`g.type = $${params.length}`);
    }
    if (query.editor_id !== undefined && query.editor_id !== null && query.editor_id !== '') {
        params.push(Number(query.editor_id));
        filters.push(`g.editor_id = $${params.length}`);
    }
    if (query.min_age !== undefined && query.min_age !== null && query.min_age !== '') {
        params.push(Number(query.min_age));
        filters.push(`g.min_age >= $${params.length}`);
    }
    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    return { where, params };
}
function buildGameSelect(where) {
    return `
    SELECT
      g.id, g.title, g.type, g.editor_id, e.name AS editor_name,
      g.min_age, g.authors, g.min_players, g.max_players, g.prototype, g.duration_minutes,
      g.theme, g.description, g.image_url, g.rules_video_url,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'description', m.description))
          FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) AS mechanisms
    FROM games g
    LEFT JOIN editor e ON e.id = g.editor_id
    LEFT JOIN game_mechanism gm ON gm.game_id = g.id
    LEFT JOIN mechanism m ON m.id = gm.mechanism_id
    ${where}
    GROUP BY
      g.id, g.title, g.type, g.editor_id, e.name, g.min_age, g.authors, g.min_players,
      g.max_players, g.prototype, g.duration_minutes, g.theme, g.description, g.image_url, g.rules_video_url
  `;
}
async function fetchGameById(gameId, client = pool) {
    const query = `${buildGameSelect('WHERE g.id = $1')} LIMIT 1`;
    const { rows } = await client.query(query, [gameId]);
    return rows.length > 0 ? rows[0] : null;
}
async function ensureEditorExists(client, editorId) {
    const { rows } = await client.query('SELECT id FROM editor WHERE id = $1', [editorId]);
    if (rows.length === 0) {
        throw new Error('EDITOR_NOT_FOUND');
    }
}
async function ensureMechanismsExist(client, mechanismIds) {
    if (mechanismIds.length === 0)
        return;
    const { rows } = await client.query('SELECT id FROM mechanism WHERE id = ANY($1::int[])', [mechanismIds]);
    const foundIds = new Set(rows.map((r) => r.id));
    const missing = mechanismIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
        const error = new Error(`MISSING_MECHANISMS:${missing.join(',')}`);
        throw error;
    }
}
async function replaceMechanisms(client, gameId, mechanismIds) {
    await client.query('DELETE FROM game_mechanism WHERE game_id = $1', [gameId]);
    if (mechanismIds.length === 0)
        return;
    const values = mechanismIds.map((id, index) => `($1, $${index + 2})`).join(',');
    await client.query(`INSERT INTO game_mechanism (game_id, mechanism_id) VALUES ${values} ON CONFLICT (game_id, mechanism_id) DO NOTHING`, [gameId, ...mechanismIds]);
}
router.get('/', async (req, res) => {
    try {
        const { where, params } = buildFilters(req.query);
        const query = `${buildGameSelect(where)} ORDER BY g.title ASC`;
        const { rows } = await pool.query(query, params);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des jeux', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/:id/mechanisms', async (req, res) => {
    const gameId = Number(req.params.id);
    if (!Number.isFinite(gameId)) {
        return res.status(400).json({ error: 'Identifiant de jeu invalide' });
    }
    try {
        const game = await fetchGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Jeu introuvable' });
        }
        res.json(game.mechanisms);
    }
    catch (err) {
        console.error('Erreur lors de la récupération des mécanismes du jeu', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/:id', async (req, res) => {
    const gameId = Number(req.params.id);
    if (!Number.isFinite(gameId)) {
        return res.status(400).json({ error: 'Identifiant de jeu invalide' });
    }
    try {
        const game = await fetchGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Jeu introuvable' });
        }
        res.json(game);
    }
    catch (err) {
        console.error('Erreur lors de la récupération du jeu', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/', async (req, res) => {
    const { data, errors } = parseGameBody(req.body, true);
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Payload invalide', details: errors });
    }
    const mechanismIds = data.mechanismIds ?? [];
    const client = await pool.connect();
    try {
        if (data.editor_id !== undefined && data.editor_id !== null) {
            await ensureEditorExists(client, data.editor_id);
        }
        await ensureMechanismsExist(client, mechanismIds);
        await client.query('BEGIN');
        const { rows } = await client.query(`
        INSERT INTO games (
          title, type, editor_id, min_age, authors,
          min_players, max_players, prototype, duration_minutes,
          theme, description, image_url, rules_video_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, false), $9, $10, $11, $12, $13)
        RETURNING id
      `, [
            data.title,
            data.type,
            data.editor_id,
            data.min_age,
            data.authors,
            data.min_players ?? null,
            data.max_players ?? null,
            data.prototype ?? false,
            data.duration_minutes ?? null,
            data.theme ?? null,
            data.description ?? null,
            data.image_url ?? null,
            data.rules_video_url ?? null,
        ]);
        const newGameId = rows[0].id;
        if (mechanismIds) {
            await replaceMechanisms(client, newGameId, mechanismIds);
        }
        await client.query('COMMIT');
        const game = await fetchGameById(newGameId, client);
        res.status(201).json(game);
    }
    catch (err) {
        await client.query('ROLLBACK');
        if (err.message === 'EDITOR_NOT_FOUND') {
            return res.status(400).json({ error: "Éditeur inexistant" });
        }
        if (typeof err.message === 'string' && err.message.startsWith('MISSING_MECHANISMS')) {
            return res.status(400).json({ error: 'Mécanisme inexistant', details: err.message });
        }
        console.error('Erreur lors de la création du jeu', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
    finally {
        client.release();
    }
});
async function updateGame(req, res) {
    const gameId = Number(req.params.id);
    if (!Number.isFinite(gameId)) {
        return res.status(400).json({ error: 'Identifiant de jeu invalide' });
    }
    const { data, errors } = parseGameBody(req.body, false);
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Payload invalide', details: errors });
    }
    const client = await pool.connect();
    try {
        const { rows: currentRows } = await client.query(`SELECT id, title, type, editor_id, min_age, authors, min_players, max_players, prototype,
              duration_minutes, theme, description, image_url, rules_video_url
       FROM games WHERE id = $1`, [gameId]);
        if (currentRows.length === 0) {
            return res.status(404).json({ error: 'Jeu introuvable' });
        }
        const current = currentRows[0];
        const merged = {
            title: data.title ?? current.title,
            type: data.type ?? current.type,
            editor_id: data.editor_id ?? current.editor_id,
            min_age: data.min_age ?? current.min_age,
            authors: data.authors ?? current.authors,
            min_players: data.min_players ?? current.min_players,
            max_players: data.max_players ?? current.max_players,
            prototype: data.prototype ?? current.prototype,
            duration_minutes: data.duration_minutes ?? current.duration_minutes,
            theme: data.theme ?? current.theme,
            description: data.description ?? current.description,
            image_url: data.image_url ?? current.image_url,
            rules_video_url: data.rules_video_url ?? current.rules_video_url,
        };
        if (!merged.title || !merged.type || merged.editor_id === null || merged.min_age === null) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }
        if (merged.min_players !== null &&
            merged.max_players !== null &&
            merged.min_players !== undefined &&
            merged.max_players !== undefined &&
            merged.min_players > merged.max_players) {
            return res
                .status(400)
                .json({ error: 'min_players ne peut pas être supérieur à max_players' });
        }
        if (merged.editor_id !== null && merged.editor_id !== undefined) {
            await ensureEditorExists(client, merged.editor_id);
        }
        const mechanismIds = data.mechanismIds !== undefined ? data.mechanismIds : undefined;
        if (mechanismIds !== undefined) {
            await ensureMechanismsExist(client, mechanismIds);
        }
        await client.query('BEGIN');
        await client.query(`
        UPDATE games
        SET title = $1,
            type = $2,
            editor_id = $3,
            min_age = $4,
            authors = $5,
            min_players = $6,
            max_players = $7,
            prototype = COALESCE($8, false),
            duration_minutes = $9,
            theme = $10,
            description = $11,
            image_url = $12,
            rules_video_url = $13
        WHERE id = $14
      `, [
            merged.title,
            merged.type,
            merged.editor_id,
            merged.min_age,
            merged.authors,
            merged.min_players ?? null,
            merged.max_players ?? null,
            merged.prototype ?? false,
            merged.duration_minutes ?? null,
            merged.theme ?? null,
            merged.description ?? null,
            merged.image_url ?? null,
            merged.rules_video_url ?? null,
            gameId,
        ]);
        if (mechanismIds !== undefined) {
            await replaceMechanisms(client, gameId, mechanismIds);
        }
        await client.query('COMMIT');
        const game = await fetchGameById(gameId, client);
        res.json(game);
    }
    catch (err) {
        await client.query('ROLLBACK');
        if (err.message === 'EDITOR_NOT_FOUND') {
            return res.status(400).json({ error: "Éditeur inexistant" });
        }
        if (typeof err.message === 'string' && err.message.startsWith('MISSING_MECHANISMS')) {
            return res.status(400).json({ error: 'Mécanisme inexistant', details: err.message });
        }
        console.error('Erreur lors de la mise à jour du jeu', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
    finally {
        client.release();
    }
}
router.put('/:id', updateGame);
router.patch('/:id', updateGame);
router.delete('/:id', async (req, res) => {
    const gameId = Number(req.params.id);
    if (!Number.isFinite(gameId)) {
        return res.status(400).json({ error: 'Identifiant de jeu invalide' });
    }
    try {
        const { rowCount } = await pool.query('DELETE FROM games WHERE id = $1', [gameId]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Jeu introuvable' });
        }
        res.json({ message: 'Jeu supprimé' });
    }
    catch (err) {
        console.error('Erreur lors de la suppression du jeu', err);
        if (err.code === '23503') {
            return res.status(409).json({
                error: 'Impossible de supprimer ce jeu car il est utilisé dans une réservation',
            });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
export default router;
//# sourceMappingURL=games.js.map
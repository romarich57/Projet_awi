import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PoolClient } from 'pg'
import pool from './database.js'

type CsvRecord = Record<string, string>

type EditorCsv = {
  idEditeur: string
  libelleEditeur: string
  exposant: string
  distributeur: string
  logoEditeur: string
}

type TypeJeuCsv = {
  idTypeJeu: string
  libelleTypeJeu: string
  idZone: string
}

type MechanismCsv = {
  idMecanism: string
  mecaName: string
  mecaDesc: string
}

type GameCsv = {
  idJeu: string
  libelleJeu: string
  auteurJeu: string
  nbMinJoueurJeu: string
  nbMaxJoueurJeu: string
  noticeJeu: string
  idEditeur: string
  idTypeJeu: string
  agemini: string
  prototype: string
  duree: string
  theme: string
  description: string
  imageJeu: string
  videoRegle: string
}

type GameMechanismCsv = {
  id: string
  idJeu: string
  idMecanism: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function findDataDirectory(): string {
  const repoRoot = path.resolve(__dirname, '../..')
  const entries = fs.readdirSync(repoRoot).map((name) => ({
    raw: name,
    normalized: name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  }))
  const match = entries.find(
    (entry) => entry.normalized.includes('data_jeux') && entry.normalized.includes('editeur'),
  )
  if (!match) {
    throw new Error('Répertoire des CSV introuvable (data_jeux _éditeurs)')
  }
  return path.join(repoRoot, match.raw)
}

const DATA_DIR = findDataDirectory()

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((value) => value.trim())
}

async function parseCsv<T extends CsvRecord>(fileName: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, fileName)
  const content = await fs.promises.readFile(filePath, 'utf-8')
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0] ?? '')
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const record: CsvRecord = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record as T
  })
}

function toNumber(value: string | undefined): number | null {
  const normalized = value?.trim() ?? ''
  if (normalized === '') return null
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

function toBoolean(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'oui'
}

function normalizeText(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.length > 0 ? trimmed : null
}

function slugify(input: string, fallback: string): string {
  const slug = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug.length > 0 ? slug : fallback
}

async function upsertEditors(client: PoolClient, records: EditorCsv[]) {
  const existingIds = new Set<number>()
  const { rows } = await client.query<{ id: number }>('SELECT id FROM editor')
  rows.forEach((row) => existingIds.add(row.id))

  let inserted = 0
  let updated = 0

  for (const record of records) {
    const id = Number(record.idEditeur)
    const name = record.libelleEditeur.trim()
    const email = `${slugify(name, `editeur-${id}`)}-${id}@dummy-editor.local`
    const logoUrl = normalizeText(record.logoEditeur)
    const isExhibitor = toBoolean(record.exposant)
    const isDistributor = toBoolean(record.distributeur)

    const result = await client.query(
      `
        INSERT INTO editor (id, name, email, website, description, logo_url, is_exhibitor, is_distributor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            website = EXCLUDED.website,
            description = EXCLUDED.description,
            logo_url = EXCLUDED.logo_url,
            is_exhibitor = EXCLUDED.is_exhibitor,
            is_distributor = EXCLUDED.is_distributor
      `,
      [id, name, email, null, null, logoUrl, isExhibitor, isDistributor],
    )

    if (existingIds.has(id)) updated++
    else inserted++
  }

  console.log(`✅ Éditeurs insérés/mis à jour: ${inserted} créés, ${updated} mis à jour`)
}

async function upsertReservantsFromEditors(client: PoolClient, records: EditorCsv[]) {
  // Récupérer les réservants existants liés à un éditeur
  const existingEditorIds = new Set<number>()
  const { rows } = await client.query<{ editor_id: number }>(
    'SELECT editor_id FROM reservant WHERE editor_id IS NOT NULL'
  )
  rows.forEach((row) => existingEditorIds.add(row.editor_id))

  let inserted = 0
  let skipped = 0

  for (const record of records) {
    const editorId = Number(record.idEditeur)
    const name = record.libelleEditeur.trim()
    const email = `${slugify(name, `editeur-${editorId}`)}-${editorId}@dummy-editor.local`

    // Skip si un réservant existe déjà pour cet éditeur
    if (existingEditorIds.has(editorId)) {
      skipped++
      continue
    }

    await client.query(
      `
        INSERT INTO reservant (name, email, type, editor_id, phone_number, address, siret, notes)
        VALUES ($1, $2, 'editeur', $3, NULL, NULL, NULL, 'Créé automatiquement depuis le catalogue éditeurs')
      `,
      [name, email, editorId],
    )
    inserted++
  }

  console.log(`✅ Réservants (éditeurs) insérés: ${inserted} créés, ${skipped} déjà existants`)
}

async function upsertMechanisms(client: PoolClient, records: MechanismCsv[]) {
  const existingIds = new Set<number>()
  const { rows } = await client.query<{ id: number }>('SELECT id FROM mechanism')
  rows.forEach((row) => existingIds.add(row.id))

  let inserted = 0
  let updated = 0

  for (const record of records) {
    const id = Number(record.idMecanism)
    const name = record.mecaName.trim()
    const description = normalizeText(record.mecaDesc)

    const result = await client.query(
      `
        INSERT INTO mechanism (id, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description
      `,
      [id, name, description],
    )

    if (existingIds.has(id)) updated++
    else inserted++
  }

  console.log(`✅ Mécanismes insérés/mis à jour: ${inserted} créés, ${updated} mis à jour`)
}

async function upsertGames(client: PoolClient, records: GameCsv[], typeMap: Map<number, string>) {
  const existingIds = new Set<number>()
  const { rows } = await client.query<{ id: number }>('SELECT id FROM games')
  rows.forEach((row) => existingIds.add(row.id))

  // Récupérer les IDs des éditeurs existants pour éviter les erreurs de clé étrangère
  const existingEditorIds = new Set<number>()
  const { rows: editorRows } = await client.query<{ id: number }>('SELECT id FROM editor')
  editorRows.forEach((row) => existingEditorIds.add(row.id))

  let inserted = 0
  let updated = 0
  let skippedMissingEditor = 0

  for (const record of records) {
    const id = Number(record.idJeu)

    // Skip if ID is not a valid number
    if (!Number.isFinite(id) || id <= 0) {
      console.warn(`⚠️  Jeu ignoré: ID invalide "${record.idJeu}" pour "${record.libelleJeu}"`)
      continue
    }

    const editorId = Number(record.idEditeur)

    // Skip if editor doesn't exist
    if (!existingEditorIds.has(editorId)) {
      skippedMissingEditor++
      continue
    }

    const title = normalizeText(record.libelleJeu) ?? `Jeu ${id}`
    const authors = normalizeText(record.auteurJeu) ?? 'Inconnu'
    const minAge = toNumber(record.agemini) ?? 0
    const minPlayers = toNumber(record.nbMinJoueurJeu)
    const maxPlayers = toNumber(record.nbMaxJoueurJeu)
    const prototype = toBoolean(record.prototype)
    const durationMinutes = toNumber(record.duree)
    const typeLabel = typeMap.get(Number(record.idTypeJeu)) ?? `Type ${record.idTypeJeu}`
    const theme = normalizeText(record.theme)
    const description = normalizeText(record.description) ?? normalizeText(record.noticeJeu)
    const imageUrl = normalizeText(record.imageJeu)
    const rulesVideoUrl = normalizeText(record.videoRegle)

    const result = await client.query(
      `
        INSERT INTO games (
          id, title, type, editor_id, min_age, authors,
          min_players, max_players, prototype, duration_minutes,
          theme, description, image_url, rules_video_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            type = EXCLUDED.type,
            editor_id = EXCLUDED.editor_id,
            min_age = EXCLUDED.min_age,
            authors = EXCLUDED.authors,
            min_players = EXCLUDED.min_players,
            max_players = EXCLUDED.max_players,
            prototype = EXCLUDED.prototype,
            duration_minutes = EXCLUDED.duration_minutes,
            theme = EXCLUDED.theme,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            rules_video_url = EXCLUDED.rules_video_url
      `,
      [
        id,
        title,
        typeLabel,
        editorId,
        minAge,
        authors,
        minPlayers,
        maxPlayers,
        prototype,
        durationMinutes,
        theme,
        description,
        imageUrl,
        rulesVideoUrl,
      ],
    )

    if (existingIds.has(id)) updated++
    else inserted++
  }

  console.log(`✅ Jeux insérés/mis à jour: ${inserted} créés, ${updated} mis à jour${skippedMissingEditor > 0 ? `, ${skippedMissingEditor} ignorés (éditeur manquant)` : ''}`)
}

async function upsertGameMechanisms(client: PoolClient, records: GameMechanismCsv[]) {
  const existingGames = new Set<number>()
  const { rows: gameRows } = await client.query<{ id: number }>('SELECT id FROM games')
  gameRows.forEach((row) => existingGames.add(row.id))

  const existingMechanisms = new Set<number>()
  const { rows: mechRows } = await client.query<{ id: number }>('SELECT id FROM mechanism')
  mechRows.forEach((row) => existingMechanisms.add(row.id))

  let inserted = 0
  let skipped = 0

  for (const record of records) {
    const gameId = Number(record.idJeu)
    const mechanismId = Number(record.idMecanism)

    if (!existingGames.has(gameId) || !existingMechanisms.has(mechanismId)) {
      skipped++
      continue
    }

    const result = await client.query(
      `
        INSERT INTO game_mechanism (game_id, mechanism_id)
        VALUES ($1, $2)
        ON CONFLICT (game_id, mechanism_id) DO NOTHING
      `,
      [gameId, mechanismId],
    )
    if ((result.rowCount ?? 0) > 0) inserted++
  }

  console.log(`✅ Liaisons jeux/mécanismes ajoutées: ${inserted} (ignorés: ${skipped})`)
}

async function fixSequences(client: PoolClient) {
  const sequences = [
    { table: 'editor', column: 'id' },
    { table: 'games', column: 'id' },
    { table: 'mechanism', column: 'id' },
    { table: 'reservant', column: 'id' },
  ]

  for (const seq of sequences) {
    await client.query(
      `
        SELECT setval(
          pg_get_serial_sequence($1, $2),
          (SELECT COALESCE(MAX(id), 0) FROM ${seq.table})
        );
      `,
      [seq.table, seq.column],
    )
  }
  console.log('✅ Séquences recalées sur les valeurs maximales')
}

async function runSeed() {
  const client = await pool.connect()
  try {
    console.log('🔄 Import des CSV UC-R4...')
    const [editors, types, mechanisms, games, gameMechanisms] = await Promise.all([
      parseCsv<EditorCsv>('editeur.csv'),
      parseCsv<TypeJeuCsv>('typeJeu.csv'),
      parseCsv<MechanismCsv>('mecanism.csv'),
      parseCsv<GameCsv>('jeu.csv'),
      parseCsv<GameMechanismCsv>('jeu_mecanism.csv'),
    ])

    const typeMap = new Map<number, string>()
    types.forEach((t) => {
      const id = Number(t.idTypeJeu)
      typeMap.set(id, normalizeText(t.libelleTypeJeu) ?? `Type ${id}`)
    })

    await client.query('BEGIN')
    await upsertEditors(client, editors)
    await upsertReservantsFromEditors(client, editors)
    await upsertMechanisms(client, mechanisms)
    await upsertGames(client, games, typeMap)
    await upsertGameMechanisms(client, gameMechanisms)
    await fixSequences(client)
    await client.query('COMMIT')

    console.log('✅ Seed UC-R4 terminé')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur pendant le seed UC-R4', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

runSeed().catch((err) => {
  console.error('❌ Échec du seed UC-R4', err)
  process.exitCode = 1
})

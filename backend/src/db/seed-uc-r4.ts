// Role : Importer et enrichir les donnees du catalogue UC-R4 dans la base.
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PoolClient } from 'pg'
import pool from './database.js'
import { MANUAL_EDITORS, MANUAL_GAMES } from './data-enrichment.js'

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

// Role : Trouver le dossier des CSV en fonction du nom normalise.
// Preconditions : Le script est execute depuis le repo.
// Postconditions : Retourne le chemin du dossier contenant les CSV.
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

// Role : Decouper une ligne CSV en cellules en respectant les guillemets.
// Preconditions : line est une chaine brute issue du fichier CSV.
// Postconditions : Retourne un tableau de cellules nettoyees.
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

// Role : Lire un CSV et le transformer en tableau d'objets typés.
// Preconditions : fileName correspond a un fichier CSV existant.
// Postconditions : Retourne une liste d'enregistrements du type attendu.
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

// Role : Convertir une valeur texte en nombre.
// Preconditions : value peut etre undefined ou une chaine numerique.
// Postconditions : Retourne un nombre valide ou null.
function toNumber(value: string | undefined): number | null {
  const normalized = value?.trim() ?? ''
  if (normalized === '') return null
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

// Role : Convertir une valeur texte en booleen.
// Preconditions : value peut etre undefined ou une chaine.
// Postconditions : Retourne true pour 1/true/oui, sinon false.
function toBoolean(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'oui'
}

// Role : Nettoyer une chaine et retourner null si vide.
// Preconditions : value peut etre undefined.
// Postconditions : Retourne la chaine nettoyee ou null.
function normalizeText(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.length > 0 ? trimmed : null
}

// Role : Generer un slug a partir d'une chaine.
// Preconditions : input est une chaine et fallback est defini.
// Postconditions : Retourne un slug ou le fallback si vide.
function slugify(input: string, fallback: string): string {
  const slug = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug.length > 0 ? slug : fallback
}

// Role : Inserer ou mettre a jour les editeurs depuis le CSV.
// Preconditions : client est connecte et records est charge.
// Postconditions : Les editeurs sont upsertes et un resume est logge.
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

    // Enrichissement
    const manualData = MANUAL_EDITORS.find((e) => e.id === id)
    const finalWebsite = manualData?.website ?? null
    const finalDescription = manualData?.description ?? null
    const finalLogoUrl = manualData?.logoUrl ?? logoUrl

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
      [id, name, email, finalWebsite, finalDescription, finalLogoUrl, isExhibitor, isDistributor],
    )

    if (existingIds.has(id)) updated++
    else inserted++
  }

  console.log(`✅ Éditeurs insérés/mis à jour: ${inserted} créés, ${updated} mis à jour`)
}

// Role : Inserer les reservants derives des editeurs.
// Preconditions : client est connecte et records est charge.
// Postconditions : Les reservants manquants sont crees.
async function upsertReservantsFromEditors(client: PoolClient, records: EditorCsv[]) {
  // Recuperer les reservants existants lies a un editeur
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

    // Ignorer si un reservant existe deja pour cet editeur
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

// Role : Inserer ou mettre a jour les mecanismes.
// Preconditions : client est connecte et records est charge.
// Postconditions : Les mecanismes sont upsertes et un resume est logge.
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

// Role : Inserer ou mettre a jour les jeux.
// Preconditions : client est connecte, records est charge, typeMap est construit.
// Postconditions : Les jeux sont upsertes et un resume est logge.
async function upsertGames(client: PoolClient, records: GameCsv[], typeMap: Map<number, string>) {
  const existingIds = new Set<number>()
  const { rows } = await client.query<{ id: number }>('SELECT id FROM games')
  rows.forEach((row) => existingIds.add(row.id))

  // Recuperer les IDs des editeurs existants pour eviter les erreurs de cle etrangere
  const existingEditorIds = new Set<number>()
  const { rows: editorRows } = await client.query<{ id: number }>('SELECT id FROM editor')
  editorRows.forEach((row) => existingEditorIds.add(row.id))

  let inserted = 0
  let updated = 0
  let skippedMissingEditor = 0

  for (const record of records) {
    const id = Number(record.idJeu)

    // Ignorer si l'ID n'est pas un nombre valide
    if (!Number.isFinite(id) || id <= 0) {
      console.warn(`⚠️  Jeu ignoré: ID invalide "${record.idJeu}" pour "${record.libelleJeu}"`)
      continue
    }

    const editorId = Number(record.idEditeur)

    // Ignorer si l'editeur n'existe pas
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

    // Enrichissement
    const manualData = MANUAL_GAMES.find((g) => g.id === id)
    const finalDescription = manualData?.description ?? description
    const finalImageUrl = manualData?.imageUrl ?? imageUrl
    const finalRulesVideoUrl = manualData?.rulesVideoUrl ?? rulesVideoUrl

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
        finalDescription,
        finalImageUrl,
        finalRulesVideoUrl,
      ],
    )

    if (existingIds.has(id)) updated++
    else inserted++
  }

  console.log(`✅ Jeux insérés/mis à jour: ${inserted} créés, ${updated} mis à jour${skippedMissingEditor > 0 ? `, ${skippedMissingEditor} ignorés (éditeur manquant)` : ''}`)
}

// Role : Inserer les liaisons jeux/mecanismes.
// Preconditions : client est connecte et records est charge.
// Postconditions : Les liaisons valides sont inserees.
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

// Role : Recaler les sequences sur les valeurs max des tables.
// Preconditions : client est connecte.
// Postconditions : Les sequences sont mises a jour.
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

// Role : Lancer l'import complet UC-R4.
// Preconditions : Les CSV sont accessibles et la base est disponible.
// Postconditions : Les donnees sont importees ou un rollback est effectue.
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

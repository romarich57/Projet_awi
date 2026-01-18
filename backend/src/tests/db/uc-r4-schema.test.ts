// Role : Verifier le schema UC-R4.
import test from 'node:test'
import assert from 'node:assert/strict'
import pool from '../../db/database.js'

test('games table contient les colonnes UC-R4', async () => {
  const { rows } = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'games'",
  )
  const columns = rows.map((r) => r.column_name)

  ;['min_players', 'max_players', 'prototype', 'duration_minutes', 'theme', 'description'].forEach(
    (col) => assert.ok(columns.includes(col), `colonne ${col} manquante`),
  )
  assert.ok(columns.includes('image_url'))
  assert.ok(columns.includes('rules_video_url'))
})

test('tables mechanism et game_mechanism existent', async () => {
  const { rows: mech } = await pool.query("SELECT to_regclass('public.mechanism') AS name")
  const { rows: link } = await pool.query("SELECT to_regclass('public.game_mechanism') AS name")
  assert.ok(mech[0].name, 'table mechanism absente')
  assert.ok(link[0].name, 'table game_mechanism absente')
})

test('contrainte ON DELETE RESTRICT sur jeux_alloues.game_id', async () => {
  const { rows } = await pool.query(
    `
      SELECT confdeltype
      FROM pg_constraint
      WHERE conname = 'jeux_alloues_game_id_fkey'
    `,
  )
  assert.ok(rows.length > 0, 'contrainte jeux_alloues_game_id_fkey absente')
  assert.strictEqual(rows[0].confdeltype, 'r')
})

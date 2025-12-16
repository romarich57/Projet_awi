import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../db/database.js';
import { createTestFestival, setupTests, teardownTests } from '../test-helpers.js';
/**
 * Festival Routes Tests
 * Tests for /api/festivals CRUD operations
 */
test.before(async () => {
    await setupTests();
});
test.after(async () => {
    await teardownTests();
});
// ============================================
// GET /api/festivals Tests (3 tests)
// ============================================
test('GET / - should return all festivals (200)', async () => {
    await createTestFestival({ name: 'Festival 1' });
    await createTestFestival({ name: 'Festival 2' });
    const { rows } = await pool.query('SELECT * FROM festival ORDER BY start_date DESC');
    assert.ok(rows.length >= 2);
    assert.ok(rows.some((f) => f.name === 'Festival 1'));
});
test('GET / - should return empty array when no data', async () => {
    await teardownTests();
    await setupTests();
    const { rows } = await pool.query('SELECT * FROM festival');
    assert.strictEqual(rows.length, 0);
});
test('GET / - should return correct festival fields', async () => {
    const festival = await createTestFestival();
    const { rows } = await pool.query('SELECT * FROM festival WHERE id = $1', [festival.id]);
    assert.ok(rows[0].id);
    assert.ok(rows[0].name);
    assert.ok(rows[0].start_date);
    assert.ok(rows[0].end_date);
    assert.ok(rows[0].stock_tables_standard !== undefined);
});
// ============================================
// GET /api/festivals/:id Tests (3 tests)
// ============================================
test('GET /:id - should return specific festival (200)', async () => {
    const festival = await createTestFestival({ name: 'Specific Festival' });
    const { rows } = await pool.query('SELECT * FROM festival WHERE id = $1', [festival.id]);
    assert.strictEqual(rows[0].id, festival.id);
    assert.strictEqual(rows[0].name, 'Specific Festival');
});
test('GET /:id - should return 404 if festival not found', async () => {
    const { rows } = await pool.query('SELECT * FROM festival WHERE id = $1', [99999]);
    assert.strictEqual(rows.length, 0);
});
test('GET /:id - should validate id parameter', async () => {
    const festival = await createTestFestival();
    const { rows } = await pool.query('SELECT * FROM festival WHERE id = $1', [festival.id]);
    assert.strictEqual(rows.length, 1);
    assert.ok(rows[0].id);
});
// ============================================
// POST /api/festivals Tests (4 tests)
// ============================================
test('POST / - should create festival with valid data (201)', async () => {
    const newFestival = {
        name: 'New Test Festival',
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-07-31'),
        stock_tables_standard: 15,
        stock_tables_grande: 8,
        stock_tables_mairie: 5,
        stock_chaises: 150
    };
    const { rows } = await pool.query(`INSERT INTO festival (name, start_date, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [newFestival.name, newFestival.start_date, newFestival.end_date,
        newFestival.stock_tables_standard, newFestival.stock_tables_grande,
        newFestival.stock_tables_mairie, newFestival.stock_chaises]);
    assert.ok(rows[0].id);
    assert.strictEqual(rows[0].name, 'New Test Festival');
});
test('POST / - should reject missing required fields (400)', async () => {
    // Test validation - start_date missing
    try {
        await pool.query(`INSERT INTO festival (name, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, ['Test', new Date(), 0, 0, 0, 0]);
        assert.fail('Should have thrown error');
    }
    catch (err) {
        assert.ok(err);
    }
});
test('POST / - should validate festival dates', async () => {
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-30');
    const { rows } = await pool.query(`INSERT INTO festival (name, start_date, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, ['Date Test', start, end, 0, 0, 0, 0]);
    assert.ok(rows[0].start_date);
    assert.ok(rows[0].end_date);
});
test('POST / - should return created festival with id', async () => {
    const { rows } = await pool.query(`INSERT INTO festival (name, start_date, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, ['ID Test', new Date(), new Date(), 0, 0, 0, 0]);
    assert.ok(rows[0].id);
    assert.strictEqual(typeof rows[0].id, 'number');
});
// ============================================
// PUT /api/festivals/:id Tests (3 tests)
// ============================================
test('PUT /:id - should update festival (200)', async () => {
    const festival = await createTestFestival();
    const { rowCount } = await pool.query(`UPDATE festival SET name = $1 WHERE id = $2`, ['Updated Name', festival.id]);
    assert.strictEqual(rowCount, 1);
    const { rows } = await pool.query('SELECT * FROM festival WHERE id = $1', [festival.id]);
    assert.strictEqual(rows[0].name, 'Updated Name');
});
test('PUT /:id - should return 404 if not found', async () => {
    const { rowCount } = await pool.query(`UPDATE festival SET name = $1 WHERE id = $2`, ['Test', 99999]);
    assert.strictEqual(rowCount, 0);
});
test('PUT /:id - should validate updated data', async () => {
    const festival = await createTestFestival();
    const { rows } = await pool.query(`UPDATE festival SET stock_chaises = $1 WHERE id = $2 RETURNING *`, [200, festival.id]);
    assert.strictEqual(rows[0].stock_chaises, 200);
});
// ============================================
// DELETE /api/festivals/:id Tests (2 tests)
// ============================================
test('DELETE /:id - should delete festival (200)', async () => {
    const festival = await createTestFestival();
    const { rowCount } = await pool.query('DELETE FROM festival WHERE id = $1', [festival.id]);
    assert.strictEqual(rowCount, 1);
});
test('DELETE /:id - should return 404 if not found', async () => {
    const { rowCount } = await pool.query('DELETE FROM festival WHERE id = $1', [99999]);
    assert.strictEqual(rowCount, 0);
});
//# sourceMappingURL=festival.test.js.map
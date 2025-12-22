import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../db/database.js';
import usersRouter from '../../routes/users.js';
import { createTestUser, generateTestEmail, generateTestLogin, setupTests, teardownTests, } from '../test-helpers.js';
function getRouteHandler(path, method) {
    const layer = usersRouter.stack.find((item) => item.route?.path === path && item.route?.methods?.[method]);
    return layer?.route?.stack?.[layer.route.stack.length - 1]?.handle;
}
test.before(async () => {
    await setupTests();
});
test.after(async () => {
    await teardownTests();
});
test('POST /users - should create user with default role', async () => {
    const login = generateTestLogin();
    const email = generateTestEmail();
    const handler = getRouteHandler('/', 'post');
    assert.ok(handler);
    const mockReq = {
        body: {
            login,
            password: 'SecurePass123',
            firstName: 'Test',
            lastName: 'User',
            email,
            phone: '',
            avatarUrl: '',
        },
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
    };
    await handler?.(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 201);
    const { rows } = await pool.query('SELECT role FROM users WHERE login = $1', [login]);
    assert.strictEqual(rows[0].role, 'visiteur');
});
test('PUT /users/:id - should update user role and status', async () => {
    const user = await createTestUser({ emailVerified: false });
    const handler = getRouteHandler('/:id', 'put');
    assert.ok(handler);
    const mockReq = {
        params: { id: String(user.id) },
        body: {
            role: 'benevole',
            emailVerified: true,
            firstName: 'Updated',
            lastName: 'User',
            email: user.email,
        },
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
    };
    await handler?.(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    const { rows } = await pool.query('SELECT role, email_verified, first_name FROM users WHERE id = $1', [user.id]);
    assert.strictEqual(rows[0].role, 'benevole');
    assert.strictEqual(rows[0].email_verified, true);
    assert.strictEqual(rows[0].first_name, 'Updated');
});
test('PUT /users/me - should update current user profile', async () => {
    const user = await createTestUser();
    const handler = getRouteHandler('/me', 'put');
    assert.ok(handler);
    const mockReq = {
        user: { id: user.id },
        body: {
            firstName: 'Profile',
            lastName: 'Updated',
            email: user.email,
        },
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
    };
    await handler?.(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    const { rows } = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [
        user.id,
    ]);
    assert.strictEqual(rows[0].first_name, 'Profile');
    assert.strictEqual(rows[0].last_name, 'Updated');
});
test('DELETE /users/me - should delete current user', async () => {
    const user = await createTestUser();
    const handler = getRouteHandler('/me', 'delete');
    assert.ok(handler);
    const mockReq = {
        user: { id: user.id },
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        clearCookie() {
            return this;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
    };
    await handler?.(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    const { rowCount } = await pool.query('SELECT 1 FROM users WHERE id = $1', [user.id]);
    assert.strictEqual(rowCount, 0);
});
//# sourceMappingURL=users.test.js.map
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyToken } from '../../middleware/token-management.js';
import { createTestUser, createValidToken, createExpiredToken, createInvalidToken, setupTests, teardownTests } from '../test-helpers.js';
/**
 * Auth Middleware Tests
 * Tests for verifyToken middleware
 */
// Setup and teardown
test.before(async () => {
    await setupTests();
});
test.after(async () => {
    await teardownTests();
});
// ============================================
// Valid Token Tests (2 tests)
// ============================================
test('verifyToken - should allow request with valid access_token cookie', async () => {
    const user = await createTestUser();
    const token = createValidToken({
        id: user.id,
        login: user.login,
        role: user.role
    });
    const mockReq = {
        cookies: {
            access_token: token
        },
        user: undefined
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = true;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(nextCalled, true, 'next() should have been called');
    assert.strictEqual(mockRes.statusCode, 200, 'Status should remain 200');
});
test('verifyToken - should attach user object to req.user', async () => {
    const user = await createTestUser();
    const token = createValidToken({
        id: user.id,
        login: user.login,
        role: user.role
    });
    const mockReq = {
        cookies: {
            access_token: token
        },
        user: undefined
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
        }
    };
    const mockNext = () => { };
    verifyToken(mockReq, mockRes, mockNext);
    assert.ok(mockReq.user, 'User should be attached to request');
    assert.strictEqual(mockReq.user.id, user.id);
    assert.strictEqual(mockReq.user.login, user.login);
    assert.strictEqual(mockReq.user.role, user.role);
});
// ============================================
// Invalid Token Tests (7 tests)
// ============================================
test('verifyToken - should reject request without access_token cookie', async () => {
    const mockReq = {
        cookies: {}
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = false;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 401);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('Token manquant'));
    assert.strictEqual(nextCalled, false);
});
test('verifyToken - should reject request with invalid token signature', async () => {
    const user = await createTestUser();
    const invalidToken = createInvalidToken({
        id: user.id,
        login: user.login,
        role: user.role
    });
    const mockReq = {
        cookies: {
            access_token: invalidToken
        }
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = true;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 403);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('invalide'));
    assert.strictEqual(nextCalled, false);
});
test('verifyToken - should reject request with expired token', async () => {
    const user = await createTestUser();
    const expiredToken = createExpiredToken({
        id: user.id,
        login: user.login,
        role: user.role
    });
    const mockReq = {
        cookies: {
            access_token: expiredToken
        }
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = true;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 403);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('expiré'));
    assert.strictEqual(nextCalled, false);
});
test('verifyToken - should reject request with malformed token', async () => {
    const mockReq = {
        cookies: {
            access_token: 'this-is-not-a-valid-jwt-token'
        }
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = true;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 403);
    assert.ok(mockRes.jsonData?.error);
    assert.strictEqual(nextCalled, false);
});
test('verifyToken - should not call next() on invalid token', async () => {
    const mockReq = {
        cookies: {
            access_token: 'invalid'
        }
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
        }
    };
    let nextCalled = false;
    const mockNext = () => {
        nextCalled = true;
    };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(nextCalled, false, 'next() should NOT have been called');
});
test('verifyToken - should return proper error message for missing token', async () => {
    const mockReq = {
        cookies: {}
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
        }
    };
    const mockNext = () => { };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 401);
    assert.ok(mockRes.jsonData);
    assert.ok(mockRes.jsonData.error);
    assert.strictEqual(typeof mockRes.jsonData.error, 'string');
    assert.ok(mockRes.jsonData.error.length > 0);
});
test('verifyToken - should return proper error message for invalid token', async () => {
    const mockReq = {
        cookies: {
            access_token: 'clearly-invalid-token'
        }
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
        }
    };
    const mockNext = () => { };
    verifyToken(mockReq, mockRes, mockNext);
    assert.strictEqual(mockRes.statusCode, 403);
    assert.ok(mockRes.jsonData);
    assert.ok(mockRes.jsonData.error);
    assert.strictEqual(typeof mockRes.jsonData.error, 'string');
    assert.ok(mockRes.jsonData.error.includes('invalide') || mockRes.jsonData.error.includes('expiré'));
});
//# sourceMappingURL=auth.test.js.map
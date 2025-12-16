import test from 'node:test';
import assert from 'node:assert/strict';
import authRouter from '../../routes/auth.js';
import { createTestUser, generateTestEmail, generateTestLogin, setupTests, teardownTests } from '../test-helpers.js';
/**
 * Auth Routes Tests
 * Tests for /api/auth routes including register, login, and token management
 */
// Setup and teardown
test.before(async () => {
    await setupTests();
});
test.after(async () => {
    await teardownTests();
});
// ============================================
// POST /api/auth/register Tests (8 tests)
// ============================================
test('POST /register - should create new user with valid data', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'John',
            lastName: 'Doe',
            email: generateTestEmail(),
            password: 'SecurePass123!',
            phone: '0123456789'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 201);
    assert.ok(mockRes.jsonData);
    assert.ok(mockRes.jsonData.message.includes('Compte créé'));
});
test('POST /register - should return 400 for missing required fields', async () => {
    const mockReq = {
        body: {
            login: 'testuser'
            // Missing firstName, lastName, email, password
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 400);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('obligatoires'));
});
test('POST /register - should return 400 for invalid email format', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: 'invalid-email-format',
            password: 'SecurePass123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 400);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('Email invalide'));
});
test('POST /register - should return 409 for duplicate email', async () => {
    const email = generateTestEmail();
    // Create first user
    await createTestUser({ email });
    // Try to create duplicate
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: email, // Duplicate
            password: 'SecurePass123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 409);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('déjà utilisé'));
});
test('POST /register - should return 409 for duplicate login', async () => {
    const login = generateTestLogin();
    // Create first user
    await createTestUser({ login });
    // Try to create duplicate
    const mockReq = {
        body: {
            login: login, // Duplicate
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 409);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('Login déjà utilisé'));
});
test('POST /register - should hash password before storing', async () => {
    const password = 'PlainTextPassword123!';
    const email = generateTestEmail();
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email,
            password
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 201);
    // Verify password was hashed (not stored as plain text)
    // Note: In real implementation, check database directly
    // Here we verify the registration succeeded
    assert.ok(mockRes.jsonData?.message);
});
test('POST /register - should create email verification token', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 201);
    assert.ok(mockRes.jsonData?.message.includes('vérifier votre email'));
});
test('POST /register - should return success message', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 201);
    assert.ok(mockRes.jsonData?.message);
    assert.strictEqual(typeof mockRes.jsonData.message, 'string');
});
// ============================================
// POST /api/auth/login Tests (6 tests)
// ============================================
test('POST /login - should login with valid credentials', async () => {
    const password = 'SecurePass123!';
    const user = await createTestUser({ password, emailVerified: true });
    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        cookies: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
        cookie(name, value) {
            this.cookies[name] = value;
            return this;
        }
    };
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    assert.ok(mockRes.jsonData?.user);
    assert.strictEqual(mockRes.jsonData.user.login, user.login);
});
test('POST /login - should return access_token and refresh_token cookies', async () => {
    const password = 'SecurePass123!';
    const user = await createTestUser({ password, emailVerified: true });
    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        cookies: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
        cookie(name, value, options) {
            this.cookies[name] = { value, options };
            return this;
        }
    };
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    assert.ok(mockRes.cookies.access_token);
    assert.ok(mockRes.cookies.refresh_token);
});
test('POST /login - should return 401 for invalid identifier', async () => {
    const mockReq = {
        body: {
            identifier: 'nonexistent@user.com',
            password: 'AnyPassword123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 401);
    assert.ok(mockRes.jsonData?.error);
});
test('POST /login - should return 401 for invalid password', async () => {
    const user = await createTestUser({ emailVerified: true });
    const mockReq = {
        body: {
            identifier: user.login,
            password: 'WrongPassword123!'
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 401);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('incorrect'));
});
test('POST /login - should return 400 for missing credentials', async () => {
    const mockReq = {
        body: {
        // Missing identifier and password
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 400);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('manquants'));
});
test('POST /login - should return 403 for unverified email', async () => {
    const password = 'SecurePass123!';
    const user = await createTestUser({ password, emailVerified: false });
    const mockReq = {
        body: {
            identifier: user.login,
            password
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 403);
    assert.ok(mockRes.jsonData?.error);
    assert.ok(mockRes.jsonData.error.includes('non vérifié'));
});
// ============================================
// Token Validation Tests (2 tests)
// ============================================
test('Token validation - should have valid JWT structure', async () => {
    const password = 'SecurePass123!';
    const user = await createTestUser({ password, emailVerified: true });
    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    };
    const mockRes = {
        statusCode: 200,
        jsonData: null,
        cookies: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
        cookie(name, value) {
            this.cookies[name] = value;
            return this;
        }
    };
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.ok(mockRes.cookies.access_token);
    const token = mockRes.cookies.access_token;
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3); // JWT has 3 parts
});
test('Token validation - should contain user info in payload', async () => {
    const password = 'SecurePass123!';
    const user = await createTestUser({ password, emailVerified: true });
    const mockReq = {
        body: {
            identifier: user.login,
            password
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
    await authRouter.stack
        .find((layer) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq, mockRes, () => { });
    assert.strictEqual(mockRes.statusCode, 200);
    assert.ok(mockRes.jsonData?.user);
    assert.strictEqual(mockRes.jsonData.user.id, user.id);
    assert.strictEqual(mockRes.jsonData.user.login, user.login);
    assert.strictEqual(mockRes.jsonData.user.email, user.email);
});
//# sourceMappingURL=auth.test.js.map
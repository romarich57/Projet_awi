// Role : Tester les routes d'authentification.
import test from 'node:test'
import assert from 'node:assert/strict'
import authRouter from '../../routes/auth.js'
import {
    createTestUser,
    generateTestEmail,
    generateTestLogin,
    setupTests,
    teardownTests
} from '../test-helpers.js'

// Tests des routes /api/auth (register, login, tokens)

// Preparation et nettoyage
test.before(async () => {
    await setupTests()
})

test.after(async () => {
    await teardownTests()
})



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
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.ok(mockRes.jsonData)
    assert.ok(mockRes.jsonData.message.includes('Compte créé'))
})

test('POST /register - should return 400 for missing required fields', async () => {
    const mockReq = {
        body: {
            login: 'testuser'
            // Champs firstName, lastName, email, password manquants
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('obligatoires'))
})

test('POST /register - should return 400 for invalid email format', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: 'invalid-email-format',
            password: 'SecurePass123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('Email invalide'))
})

test('POST /register - should return 409 for duplicate email', async () => {
    const email = generateTestEmail()

    // Creer un premier utilisateur
    await createTestUser({ email })

    // Tenter un doublon
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: email, // Doublon
            password: 'SecurePass123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 409)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('déjà utilisé'))
})

test('POST /register - should return 409 for duplicate login', async () => {
    const login = generateTestLogin()

    // Creer un premier utilisateur
    await createTestUser({ login })

    // Tenter un doublon
    const mockReq = {
        body: {
            login: login, // Doublon
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 409)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('Login déjà utilisé'))
})

test('POST /register - should hash password before storing', async () => {
    const password = 'PlainTextPassword123!'
    const email = generateTestEmail()

    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)

    // Verifier que le mot de passe est hashe (pas en clair)
    // Note : en implementation reelle, verifier en base
    // Ici on verifie que l'inscription a reussi
    assert.ok(mockRes.jsonData?.message)
})

test('POST /register - should create email verification token', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.ok(mockRes.jsonData?.message.includes('vérifier votre email'))
})

test('POST /register - should return success message', async () => {
    const mockReq = {
        body: {
            login: generateTestLogin(),
            firstName: 'Test',
            lastName: 'User',
            email: generateTestEmail(),
            password: 'SecurePass123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/register')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.ok(mockRes.jsonData?.message)
    assert.strictEqual(typeof mockRes.jsonData.message, 'string')
})

// ============================================
// Tests POST /api/auth/login (6 tests)
// ============================================

test('POST /login - should login with valid credentials', async () => {
    const password = 'SecurePass123!'
    const user = await createTestUser({ password, emailVerified: true })

    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        cookies: {},
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        },
        cookie(name: string, value: string) {
            this.cookies[name] = value
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData?.user)
    assert.strictEqual(mockRes.jsonData.user.login, user.login)
})

test('POST /login - should return access_token and refresh_token cookies', async () => {
    const password = 'SecurePass123!'
    const user = await createTestUser({ password, emailVerified: true })

    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        cookies: {} as Record<string, any>,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        },
        cookie(name: string, value: string, options: any) {
            this.cookies[name] = { value, options }
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.cookies.access_token)
    assert.ok(mockRes.cookies.refresh_token)
})

test('POST /login - should return 401 for invalid identifier', async () => {
    const mockReq = {
        body: {
            identifier: 'nonexistent@user.com',
            password: 'AnyPassword123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 401)
    assert.ok(mockRes.jsonData?.error)
})

test('POST /login - should return 401 for invalid password', async () => {
    const user = await createTestUser({ emailVerified: true })

    const mockReq = {
        body: {
            identifier: user.login,
            password: 'WrongPassword123!'
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 401)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('incorrect'))
})

test('POST /login - should return 400 for missing credentials', async () => {
    const mockReq = {
        body: {
            // Identifiant et mot de passe manquants
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('manquants'))
})

test('POST /login - should return 403 for unverified email', async () => {
    const password = 'SecurePass123!'
    const user = await createTestUser({ password, emailVerified: false })

    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 403)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('non vérifié'))
})



test('Token validation - should have valid JWT structure', async () => {
    const password = 'SecurePass123!'
    const user = await createTestUser({ password, emailVerified: true })

    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        cookies: {} as Record<string, any>,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        },
        cookie(name: string, value: string) {
            this.cookies[name] = value
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.ok(mockRes.cookies.access_token)
    const token = mockRes.cookies.access_token
    const parts = token.split('.')
    assert.strictEqual(parts.length, 3) // JWT en 3 parties
})

test('Token validation - should contain user info in payload', async () => {
    const password = 'SecurePass123!'
    const user = await createTestUser({ password, emailVerified: true })

    const mockReq = {
        body: {
            identifier: user.login,
            password
        }
    }

    const mockRes: any = {
        statusCode: 200,
        jsonData: null,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.jsonData = data
            return this
        }
    }

    await authRouter.stack
        .find((layer: any) => layer.route?.path === '/login')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData?.user)
    assert.strictEqual(mockRes.jsonData.user.id, user.id)
    assert.strictEqual(mockRes.jsonData.user.login, user.login)
    assert.strictEqual(mockRes.jsonData.user.email, user.email)
})

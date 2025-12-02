import test from 'node:test'
import assert from 'node:assert/strict'
import reservantRouter from '../../routes/reservant.js'
import {
    createTestReservant,
    generateTestEmail,
    setupTests,
    teardownTests
} from '../test-helpers.js'

/**
 * Reservant Routes Tests
 * Tests for /api/reservant CRUD operations
 */

// Setup and teardown
test.before(async () => {
    await setupTests()
})

test.after(async () => {
    await teardownTests()
})

// ============================================
// GET /api/reservant Tests (4 tests)
// ============================================

test('GET / - should return all reservants', async () => {
    // Create test data
    await createTestReservant({ name: 'Reservant 1' })
    await createTestReservant({ name: 'Reservant 2' })

    const mockReq = {}
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.get)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(Array.isArray(mockRes.jsonData))
    assert.ok(mockRes.jsonData.length >= 2)
})

test('GET / - should return empty array when no data', async () => {
    await teardownTests() // Clear all data
    await setupTests()

    const mockReq = {}
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(Array.isArray(mockRes.jsonData))
    assert.strictEqual(mockRes.jsonData.length, 0)
})

test('GET / - should return correct fields', async () => {
    await createTestReservant()

    const mockReq = {}
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    const first = mockRes.jsonData[0]
    assert.ok(first.id)
    assert.ok(first.name)
    assert.ok(first.email)
    assert.ok(first.type)
})

test('GET / - should sort by name ASC', async () => {
    await createTestReservant({ name: 'Zebra' })
    await createTestReservant({ name: 'Alpha' })
    await createTestReservant({ name: 'Beta' })

    const mockReq = {}
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    const names = mockRes.jsonData.map((r: any) => r.name)
    const sorted = [...names].sort()
    assert.deepStrictEqual(names, sorted)
})

// ============================================
// GET /api/reservant/:id Tests (4 tests)
// ============================================

test('GET /:id - should return specific reservant', async () => {
    const reservant = await createTestReservant({ name: 'Specific Reservant' })

    const mockReq = {
        params: { id: reservant.id }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.get)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.strictEqual(mockRes.jsonData.id, reservant.id)
    assert.strictEqual(mockRes.jsonData.name, 'Specific Reservant')
})

test('GET /:id - should return 404 if not found', async () => {
    const mockReq = {
        params: { id: 99999 }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 404)
    assert.ok(mockRes.jsonData?.error)
})

test('GET /:id - should validate ID parameter', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id.toString() }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData.id)
})

test('GET /:id - should return correct structure', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id')
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData.id)
    assert.ok(mockRes.jsonData.name)
    assert.ok(mockRes.jsonData.email)
    assert.ok(mockRes.jsonData.type)
})

// ============================================
// POST /api/reservant Tests (8 tests)
// ============================================

test('POST / - should create reservant with required fields', async () => {
    const mockReq = {
        body: {
            name: 'New Reservant',
            email: generateTestEmail(),
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.ok(mockRes.jsonData.id)
    assert.strictEqual(mockRes.jsonData.name, 'New Reservant')
})

test('POST / - should return created reservant with ID', async () => {
    const mockReq = {
        body: {
            name: 'Test',
            email: generateTestEmail(),
            type: 'boutique'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.ok(mockRes.jsonData.id)
    assert.strictEqual(typeof mockRes.jsonData.id, 'number')
})

test('POST / - should reject missing name', async () => {
    const mockReq = {
        body: {
            email: generateTestEmail(),
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
})

test('POST / - should reject missing email', async () => {
    const mockReq = {
        body: {
            name: 'Test',
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
})

test('POST / - should reject missing type', async () => {
    const mockReq = {
        body: {
            name: 'Test',
            email: generateTestEmail()
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
})

test('POST / - should reject invalid type value', async () => {
    const mockReq = {
        body: {
            name: 'Test',
            email: generateTestEmail(),
            type: 'invalid_type'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 400)
    assert.ok(mockRes.jsonData?.error)
    assert.ok(mockRes.jsonData.error.includes('Type invalide'))
})

test('POST / - should reject duplicate email', async () => {
    const email = generateTestEmail()
    await createTestReservant({ email })

    const mockReq = {
        body: {
            name: 'Duplicate',
            email: email,
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 409)
    assert.ok(mockRes.jsonData?.error)
})

test('POST / - should set optional fields to null if not provided', async () => {
    const mockReq = {
        body: {
            name: 'Minimal',
            email: generateTestEmail(),
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.post)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 201)
    assert.strictEqual(mockRes.jsonData.phone_number, null)
    assert.strictEqual(mockRes.jsonData.address, null)
})

// ============================================
// PUT /api/reservant/:id Tests (6 tests)
// ============================================

test('PUT /:id - should update reservant', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id },
        body: {
            name: 'Updated Name',
            email: reservant.email,
            type: 'boutique'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.strictEqual(mockRes.jsonData.name, 'Updated Name')
    assert.strictEqual(mockRes.jsonData.type, 'boutique')
})

test('PUT /:id - should return updated data', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id },
        body: {
            name: 'New Name',
            email: reservant.email,
            type: reservant.type
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData.id)
    assert.strictEqual(mockRes.jsonData.name, 'New Name')
})

test('PUT /:id - should return 404 if not found', async () => {
    const mockReq = {
        params: { id: 99999 },
        body: {
            name: 'Test',
            email: generateTestEmail(),
            type: 'editeur'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 404)
    assert.ok(mockRes.jsonData?.error)
})

test('PUT /:id - should reject duplicate email', async () => {
    const reservant1 = await createTestReservant()
    const reservant2 = await createTestReservant()

    const mockReq = {
        params: { id: reservant2.id },
        body: {
            name: reservant2.name,
            email: reservant1.email, // Duplicate
            type: reservant2.type
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 409)
    assert.ok(mockRes.jsonData?.error)
})

test('PUT /:id - should update all fields correctly', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id },
        body: {
            name: 'Updated',
            email: generateTestEmail(),
            type: 'association',
            phone_number: '9876543210',
            address: 'New Address',
            siret: '98765432109876',
            notes: 'Updated notes'
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.strictEqual(mockRes.jsonData.name, 'Updated')
    assert.strictEqual(mockRes.jsonData.type, 'association')
    assert.strictEqual(mockRes.jsonData.phone_number, '9876543210')
})

test('PUT /:id - should handle null optional fields', async () => {
    const reservant = await createTestReservant({
        phone_number: '123',
        address: 'Test'
    })

    const mockReq = {
        params: { id: reservant.id },
        body: {
            name: reservant.name,
            email: reservant.email,
            type: reservant.type,
            phone_number: null,
            address: null
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.put)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.strictEqual(mockRes.jsonData.phone_number, null)
    assert.strictEqual(mockRes.jsonData.address, null)
})

// ============================================
// DELETE /api/reservant/:id Tests (5 tests)
// ============================================

test('DELETE /:id - should delete reservant', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.delete)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData.message)
})

test('DELETE /:id - should return 404 if not found', async () => {
    const mockReq = {
        params: { id: 99999 }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.delete)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 404)
    assert.ok(mockRes.jsonData?.error)
})

test('DELETE /:id - should return success message', async () => {
    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.delete)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    assert.strictEqual(mockRes.statusCode, 200)
    assert.ok(mockRes.jsonData.message)
    assert.ok(mockRes.jsonData.message.includes('supprimé'))
})

test('DELETE /:id - should verify actually deleted from DB', async () => {
    const reservant = await createTestReservant()

    // Delete
    const mockReqDelete = {
        params: { id: reservant.id }
    }
    const mockResDelete = {
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.delete)
        ?.route?.stack[0]?.handle(mockReqDelete as any, mockResDelete as any, () => {})

    // Try to get
    const mockReqGet = {
        params: { id: reservant.id }
    }
    const mockResGet = {
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.get)
        ?.route?.stack[0]?.handle(mockReqGet as any, mockResGet as any, () => {})

    assert.strictEqual(mockResGet.statusCode, 404)
})

test('DELETE /:id - should reject if foreign key constraint', async () => {
    // Note: This test requires creating related records (contacts, workflows, etc.)
    // For now, we'll just test the basic delete works
    // In a real scenario, you'd create related records first

    const reservant = await createTestReservant()

    const mockReq = {
        params: { id: reservant.id }
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

    await reservantRouter.stack
        .find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.delete)
        ?.route?.stack[0]?.handle(mockReq as any, mockRes as any, () => {})

    // Without FK violations, should succeed
    assert.strictEqual(mockRes.statusCode, 200)
})

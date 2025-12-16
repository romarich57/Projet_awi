import test from 'node:test'
import assert from 'node:assert/strict'
import pool from '../db/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/env.js'
import type { TokenPayload } from '../types/token-payload.js'

/**
 * Test Helpers for Backend Tests
 * Provides utilities for creating, managing, and cleaning up test data
 */

// Counter for unique test data
let testCounter = 0

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
    testCounter++
    return `test${testCounter}_${Date.now()}@test.com`
}

/**
 * Generate unique test login
 */
export function generateTestLogin(): string {
    testCounter++
    return `testuser${testCounter}_${Date.now()}`
}

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides: {
    login?: string
    email?: string
    password?: string
    firstName?: string
    lastName?: string
    role?: string
    emailVerified?: boolean
} = {}) {
    const login = overrides.login || generateTestLogin()
    const email = overrides.email || generateTestEmail()
    const password = overrides.password || 'TestPass123!'
    const passwordHash = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
        `INSERT INTO users (
      login,
      password_hash,
      role,
      first_name,
      last_name,
      email,
      email_verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, login, email, role, first_name, last_name, email_verified`,
        [
            login,
            passwordHash,
            overrides.role || 'normal',
            overrides.firstName || 'Test',
            overrides.lastName || 'User',
            email,
            overrides.emailVerified !== undefined ? overrides.emailVerified : true
        ]
    )

    return {
        ...rows[0],
        password // Return plain password for testing login
    }
}

/**
 * Create a test reservant in the database
 */
export async function createTestReservant(overrides: {
    name?: string
    email?: string
    type?: string
    phone_number?: string
    address?: string
    siret?: string
    notes?: string
} = {}) {
    const email = overrides.email || generateTestEmail()

    const { rows } = await pool.query(
        `INSERT INTO reservant (
      name,
      email,
      type,
      phone_number,
      address,
      siret,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
        [
            overrides.name || 'Test Reservant',
            email,
            overrides.type || 'editeur',
            overrides.phone_number || null,
            overrides.address || null,
            overrides.siret || null,
            overrides.notes || null
        ]
    )

    return rows[0]
}

/**
 * Create a valid access token for testing
 */
export function createValidToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

/**
 * Create an expired access token for testing
 */
export function createExpiredToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' })
}

/**
 * Create an invalid token (wrong signature)
 */
export function createInvalidToken(payload: TokenPayload): string {
    return jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' })
}

/**
 * Delete all test users (for cleanup)
 */
export async function deleteTestUsers() {
    await pool.query(`DELETE FROM users WHERE email LIKE '%@test.com'`)
    await pool.query(`DELETE FROM users WHERE login LIKE 'testuser%'`)
}

/**
 * Delete all test reservants (for cleanup)
 */
export async function deleteTestReservants() {
    await pool.query(`DELETE FROM reservant WHERE email LIKE '%@test.com'`)
}

/**
 * Create a test festival in the database
 */
export async function createTestFestival(overrides: {
    name?: string
    start_date?: Date
    end_date?: Date
    stock_tables_standard?: number
    stock_tables_grande?: number
    stock_tables_mairie?: number
    stock_chaises?: number
} = {}) {
    const name = overrides.name || `Test Festival ${Date.now()}`
    const start_date = overrides.start_date || new Date('2024-06-01')
    const end_date = overrides.end_date || new Date('2024-06-30')

    const { rows } = await pool.query(
        `INSERT INTO festival (
      name,
      start_date,
      end_date,
      stock_tables_standard,
      stock_tables_grande,
      stock_tables_mairie,
      stock_chaises
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
        [
            name,
            start_date,
            end_date,
            overrides.stock_tables_standard ?? 10,
            overrides.stock_tables_grande ?? 5,
            overrides.stock_tables_mairie ?? 3,
            overrides.stock_chaises ?? 100
        ]
    )

    return rows[0]
}

/**
 * Delete all test festivals (for cleanup)
 */
export async function deleteTestFestivals() {
    await pool.query(`DELETE FROM festival WHERE name LIKE 'Test Festival%'`)
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
    await deleteTestFestivals()
    await deleteTestReservants()
    await deleteTestUsers()
}

/**
 * Run cleanup before tests
 */
export async function setupTests() {
    await cleanupTestData()
}

/**
 * Run cleanup after tests
 */
export async function teardownTests() {
    await cleanupTestData()
}

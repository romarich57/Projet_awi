// Role : Fournir des utilitaires pour les tests backend.
import test from 'node:test'
import assert from 'node:assert/strict'
import pool from '../db/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/env.js'
import type { TokenPayload } from '../types/token-payload.js'

// Compteur pour generer des donnees de test uniques
let testCounter = 0

// Role : Generer un email de test unique.
// Preconditions : Aucune.
// Postconditions : Retourne un email unique.
export function generateTestEmail(): string {
    testCounter++
    return `test${testCounter}_${Date.now()}@test.com`
}

// Role : Generer un login de test unique.
// Preconditions : Aucune.
// Postconditions : Retourne un login unique.
export function generateTestLogin(): string {
    testCounter++
    return `testuser${testCounter}_${Date.now()}`
}

// Role : Creer un utilisateur de test en base.
// Preconditions : overrides peut fournir des champs optionnels.
// Postconditions : Retourne l'utilisateur cree avec son mot de passe.
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
            overrides.role || 'benevole',
            overrides.firstName || 'Test',
            overrides.lastName || 'User',
            email,
            overrides.emailVerified !== undefined ? overrides.emailVerified : true
        ]
    )

    return {
        ...rows[0],
        password // Mot de passe en clair pour les tests de connexion
    }
}

// Role : Creer un reservant de test en base.
// Preconditions : overrides peut fournir des champs optionnels.
// Postconditions : Retourne le reservant cree.
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

// Role : Creer un token d'acces valide pour les tests.
// Preconditions : payload est valide.
// Postconditions : Retourne un JWT valide.
export function createValidToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

// Role : Creer un token d'acces expire pour les tests.
// Preconditions : payload est valide.
// Postconditions : Retourne un JWT expire.
export function createExpiredToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' })
}

// Role : Creer un token invalide (mauvaise signature).
// Preconditions : payload est valide.
// Postconditions : Retourne un JWT invalide.
export function createInvalidToken(payload: TokenPayload): string {
    return jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' })
}

// Role : Supprimer tous les utilisateurs de test.
// Preconditions : Aucune.
// Postconditions : Les utilisateurs de test sont supprimes.
export async function deleteTestUsers() {
    await pool.query(`DELETE FROM users WHERE email LIKE '%@test.com'`)
    await pool.query(`DELETE FROM users WHERE login LIKE 'testuser%'`)
}

// Role : Supprimer tous les reservants de test.
// Preconditions : Aucune.
// Postconditions : Les reservants de test sont supprimes.
export async function deleteTestReservants() {
    await pool.query(`DELETE FROM reservant WHERE email LIKE '%@test.com'`)
}

// Role : Creer un festival de test en base.
// Preconditions : overrides peut fournir des champs optionnels.
// Postconditions : Retourne le festival cree.
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

// Role : Supprimer tous les festivals de test.
// Preconditions : Aucune.
// Postconditions : Les festivals de test sont supprimes.
export async function deleteTestFestivals() {
    await pool.query(`DELETE FROM festival WHERE name LIKE 'Test Festival%'`)
}

// Role : Nettoyer toutes les donnees de test.
// Preconditions : Aucune.
// Postconditions : Toutes les donnees de test sont supprimees.
export async function cleanupTestData() {
    await deleteTestFestivals()
    await deleteTestReservants()
    await deleteTestUsers()
}

// Role : Preparer les tests en nettoyant les donnees.
// Preconditions : Aucune.
// Postconditions : Les donnees de test sont nettoyees.
export async function setupTests() {
    await cleanupTestData()
}

// Role : Nettoyer apres les tests.
// Preconditions : Aucune.
// Postconditions : Les donnees de test sont nettoyees.
export async function teardownTests() {
    await cleanupTestData()
}

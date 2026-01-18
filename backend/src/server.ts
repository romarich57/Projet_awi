// Role : Configurer et demarrer le serveur API.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import publicRouter from './routes/public.js'
import usersRouter from './routes/users.js'
import authRouter from './routes/auth.js'
import festivalRouter from './routes/festival.js'
import zoneTarifaireRouter from './routes/zoneTarifaire.js'
import reservationRouter from './routes/reservation.js'
import reservantRouter from './routes/reservant.js'
import gamesRouter from './routes/games.js'
import mechanismsRouter from './routes/mechanisms.js'
import allocatedGamesRouter from './routes/allocatedGames.js'
import editorRouter from './routes/editor.js'
import zonePlanRouter from './routes/zonePlan.js'
import workflowRouter from './routes/workflow.js'
import uploadRouter from './routes/upload.js'
import { verifyToken } from './middleware/token-management.js'
import { requireAdmin } from './middleware/auth-admin.js'
import { requireRole } from './middleware/require-role.js'
import { ensureAdmin } from './db/initAdmin.js'
import { ensureFestivals } from './db/initFestivals.js'
import { runMigrations } from './db/migrations.js'
import { FRONTEND_ORIGINS } from './config/env.js'
import 'dotenv/config'

const PORT = Number(process.env.PORT ?? 4000)
const HOST = process.env.HOST ?? '0.0.0.0'
const HTTPS_ENABLED = process.env.HTTPS_ENABLED !== 'false'
const BACKOFFICE_ROLES = ['admin', 'super-organizer', 'organizer']

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// En-têtes de sécurité 
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next()
})

app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

// CORS : autoriser uniquement l'URL du frontend de prod (Nginx)
// Role : Normaliser une origine pour la comparaison CORS.
// Preconditions : origin est une chaine non vide.
// Postconditions : Retourne une origine sans slash final ou l'origine brute.
const normalizeOrigin = (origin: string): string => {
  try {
    return new URL(origin).origin
  } catch {
    return origin.replace(/\/$/, '')
  }
}

const allowedOrigins = (
  FRONTEND_ORIGINS.length > 0
    ? FRONTEND_ORIGINS
    : ['http://localhost:8080', 'https://localhost:8080']
).map(normalizeOrigin)

// Role : Verifier qu'une origine est autorisee.
// Preconditions : origin peut etre undefined, une chaine ou un tableau.
// Postconditions : Retourne true si l'origine est acceptee.
const isOriginAllowed = (origin?: string | string[]): boolean => {
  if (!origin) return true
  const originValue = Array.isArray(origin) ? origin[0] : origin
  if (!originValue) return true
  return allowedOrigins.includes(normalizeOrigin(originValue))
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true)
      return
    }
    callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Origin non autorisée' })
  }
  next()
})
app.use(cors(corsOptions))

// Servir les fichiers statiques (avatars uploadés)
const uploadsPath = path.resolve(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsPath))

// Routes
app.use('/api/public', verifyToken, requireRole(BACKOFFICE_ROLES), publicRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', verifyToken, usersRouter)
app.use('/api/festivals', festivalRouter) // Pas de verifyToken pour acces public sans compte
app.use(
  '/api/zones-tarifaires',
  verifyToken,
  requireRole(BACKOFFICE_ROLES),
  zoneTarifaireRouter,
)
app.use('/api/reservation', verifyToken, requireRole(BACKOFFICE_ROLES), reservationRouter)
app.use('/api/reservant', verifyToken, requireRole(BACKOFFICE_ROLES), reservantRouter)
app.use('/api/games', verifyToken, requireRole(BACKOFFICE_ROLES), gamesRouter)
app.use('/api/mechanisms', verifyToken, requireRole(BACKOFFICE_ROLES), mechanismsRouter)
app.use('/api/jeux_alloues', verifyToken, requireRole(BACKOFFICE_ROLES), allocatedGamesRouter)
app.use('/api/editors', verifyToken, requireRole(BACKOFFICE_ROLES), editorRouter)
app.use('/api/zone-plan', verifyToken, requireRole(BACKOFFICE_ROLES), zonePlanRouter)
app.use('/api/workflow', verifyToken, requireRole(BACKOFFICE_ROLES), workflowRouter)
app.use('/api/admin', verifyToken, requireAdmin, (_req, res) => {
  res.json({ message: 'Bienvenue admin' })
})
app.use('/api/upload', uploadRouter)

// HTTPS (certificats mkcert montes en volume dans /app/certs)
const certsDir = process.env.CERTS_DIR
  ? path.resolve(process.env.CERTS_DIR)
  : path.resolve(__dirname, '../certs')
const httpsKeyPath = process.env.HTTPS_KEY_PATH ?? path.join(certsDir, 'localhost-key.pem')
const httpsCertPath = process.env.HTTPS_CERT_PATH ?? path.join(certsDir, 'localhost.pem')

// Role : Charger les certificats HTTPS.
// Preconditions : Les chemins des certificats sont valides.
// Postconditions : Retourne les options TLS pour le serveur HTTPS.
const createHttpsOptions = () => ({
  key: fs.readFileSync(httpsKeyPath),
  cert: fs.readFileSync(httpsCertPath),
})

  // Démarrage
  ; (async () => {
    // Exécution des migrations de la base de données
    await runMigrations()

    // Création/validation du compte admin requise au démarrage
    await ensureAdmin()
    await ensureFestivals()

    const onReady = () => {
      const scheme = HTTPS_ENABLED ? 'https' : 'http'
      const hostToLog = HOST === '0.0.0.0' ? '0.0.0.0' : HOST
      console.log(`👍 Serveur API démarré sur ${scheme}://${hostToLog}:${PORT}`)
    }

    if (HTTPS_ENABLED) {
      https.createServer(createHttpsOptions(), app).listen(PORT, HOST, onReady)
    } else {
      http.createServer(app).listen(PORT, HOST, onReady)
    }
  })().catch((err) => {
    console.error('❌ Erreur au démarrage du serveur :', err)
    process.exit(1)
  })

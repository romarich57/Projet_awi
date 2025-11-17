import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import publicRouter from './routes/public.js'
import usersRouter from './routes/users.js'
import authRouter from './routes/auth.js'
import { verifyToken } from './middleware/token-management.js'
import { requireAdmin } from './middleware/auth-admin.js'
import { ensureAdmin } from './db/initAdmin.js'
import { FRONTEND_ORIGINS } from './config/env.js'
import 'dotenv/config'

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

// CORS : autoriser uniquement l’URL du frontend de prod (Nginx)
const allowedOrigins =
  FRONTEND_ORIGINS.length > 0
    ? FRONTEND_ORIGINS
    : ['http://localhost:8080', 'https://localhost:8080']

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error(`Origin non autorisée: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
app.use(cors(corsOptions))

// Routes
app.use('/api/public', publicRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', verifyToken, usersRouter)
app.use('/api/admin', verifyToken, requireAdmin, (_req, res) => {
  res.json({ message: 'Bienvenue admin' })
})

// HTTPS (certificats mkcert montés en volume dans /app/certs)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const certsDir = path.resolve(__dirname, '../certs')
const key = fs.readFileSync(path.join(certsDir, 'localhost-key.pem'))
const cert = fs.readFileSync(path.join(certsDir, 'localhost.pem'))

// Démarrage
;(async () => {
  // Création/validation du compte admin requise au démarrage
  await ensureAdmin()

  https.createServer({ key, cert }, app).listen(4000, () => {
    console.log('👍 Serveur API démarré sur https://localhost:4000')
  })
})().catch((err) => {
  console.error('❌ Erreur au démarrage du serveur :', err)
  process.exit(1)
})

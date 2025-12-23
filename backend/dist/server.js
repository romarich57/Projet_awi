import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import publicRouter from './routes/public.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import festivalRouter from './routes/festival.js';
import zoneTarifaireRouter from './routes/zoneTarifaire.js';
import reservationRouter from './routes/reservation.js';
import reservantRouter from './routes/reservant.js';
import gamesRouter from './routes/games.js';
import mechanismsRouter from './routes/mechanisms.js';
import allocatedGamesRouter from './routes/allocatedGames.js';
import editorRouter from './routes/editor.js';
import zonePlanRouter from './routes/zonePlan.js';
import workflowRouter from './routes/workflow.js';
import uploadRouter from './routes/upload.js';
import { verifyToken } from './middleware/token-management.js';
import { requireAdmin } from './middleware/auth-admin.js';
import { ensureAdmin } from './db/initAdmin.js';
import { ensureFestivals } from './db/initFestivals.js';
import { runMigrations } from './db/migrations.js';
import { FRONTEND_ORIGINS } from './config/env.js';
import 'dotenv/config';
const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const HTTPS_ENABLED = process.env.HTTPS_ENABLED !== 'false';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// En-têtes de sécurité 
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// Servir les fichiers statiques (avatars uploadés)
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
// CORS : autoriser uniquement l'URL du frontend de prod (Nginx)
const allowedOrigins = FRONTEND_ORIGINS.length > 0
    ? FRONTEND_ORIGINS
    : ['http://localhost:8080', 'https://localhost:8080'];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin))
            callback(null, true);
        else
            callback(new Error(`Origin non autorisée: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
// Routes
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, usersRouter);
app.use('/api/festivals', festivalRouter); //pas de verifyToken pour accès public sans compte
app.use('/api/zones-tarifaires', verifyToken, zoneTarifaireRouter);
app.use('/api/reservation', verifyToken, reservationRouter);
app.use('/api/reservant', verifyToken, reservantRouter);
app.use('/api/games', verifyToken, gamesRouter);
app.use('/api/mechanisms', verifyToken, mechanismsRouter);
app.use('/api/jeux_alloues', verifyToken, allocatedGamesRouter);
app.use('/api/editors', verifyToken, editorRouter);
app.use('/api/zone-plan', verifyToken, zonePlanRouter);
app.use('/api/workflow', verifyToken, workflowRouter);
app.use('/api/admin', verifyToken, requireAdmin, (_req, res) => {
    res.json({ message: 'Bienvenue admin' });
});
app.use('/api/upload', verifyToken, uploadRouter);
// HTTPS (certificats mkcert montés en volume dans /app/certs)
const certsDir = process.env.CERTS_DIR
    ? path.resolve(process.env.CERTS_DIR)
    : path.resolve(__dirname, '../certs');
const httpsKeyPath = process.env.HTTPS_KEY_PATH ?? path.join(certsDir, 'localhost-key.pem');
const httpsCertPath = process.env.HTTPS_CERT_PATH ?? path.join(certsDir, 'localhost.pem');
const createHttpsOptions = () => ({
    key: fs.readFileSync(httpsKeyPath),
    cert: fs.readFileSync(httpsCertPath),
});
(async () => {
    // Exécution des migrations de la base de données
    await runMigrations();
    // Création/validation du compte admin requise au démarrage
    await ensureAdmin();
    await ensureFestivals();
    const onReady = () => {
        const scheme = HTTPS_ENABLED ? 'https' : 'http';
        const hostToLog = HOST === '0.0.0.0' ? '0.0.0.0' : HOST;
        console.log(`👍 Serveur API démarré sur ${scheme}://${hostToLog}:${PORT}`);
    };
    if (HTTPS_ENABLED) {
        https.createServer(createHttpsOptions(), app).listen(PORT, HOST, onReady);
    }
    else {
        http.createServer(app).listen(PORT, HOST, onReady);
    }
})().catch((err) => {
    console.error('❌ Erreur au démarrage du serveur :', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map
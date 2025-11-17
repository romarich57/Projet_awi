import 'dotenv/config';
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
export const REFRESH_EXPIRATION = process.env.REFRESH_EXPIRATION || '7d';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const FRONTEND_ORIGINS_RAW = process.env.FRONTEND_ORIGINS ??
    `${FRONTEND_URL},https://localhost:8080`;
export const FRONTEND_ORIGINS = FRONTEND_ORIGINS_RAW.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET manquant dans .env');
}
//# sourceMappingURL=env.js.map
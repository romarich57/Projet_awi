import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Dossier d'upload des avatars
const uploadsDir = path.resolve(__dirname, '../../uploads/avatars');
// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Configuration de Multer
const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, uploadsDir);
    },
    filename(_req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'));
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // Max 2MB
    },
});
// POST /api/upload/avatar - Upload d'un avatar
router.post('/avatar', upload.single('avatar'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    res.json({ url: avatarUrl, message: 'Avatar uploadé avec succès' });
});
// Gestion des erreurs Multer
router.use((err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux (max 2MB)' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});
export default router;
//# sourceMappingURL=upload.js.map
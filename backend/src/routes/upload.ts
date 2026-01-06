import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import type { FileFilterCallback, StorageEngine } from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Dossier d'upload des avatars
const uploadsDir = path.resolve(__dirname, '../../uploads/avatars')
// Dossier d'upload des images de jeux
const gamesImagesDir = path.resolve(__dirname, '../../uploads/games')

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(gamesImagesDir)) {
    fs.mkdirSync(gamesImagesDir, { recursive: true })
}

// Configuration de Multer pour les avatars
const avatarStorage: StorageEngine = multer.diskStorage({
    destination(_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, uploadsDir)
    },
    filename(_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `avatar-${uniqueSuffix}${ext}`)
    },
})

// Configuration de Multer pour les images de jeux
const gameImageStorage: StorageEngine = multer.diskStorage({
    destination(_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, gamesImagesDir)
    },
    filename(_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `game-${uniqueSuffix}${ext}`)
    },
})

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
): void => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'))
    }
}

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // Max 2MB
    },
})

const uploadGameImage = multer({
    storage: gameImageStorage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // Max 2MB
    },
})

// POST /api/upload/avatar - Upload d'un avatar
router.post('/avatar', uploadAvatar.single('avatar'), (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined
    if (!file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' })
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`
    res.json({ url: avatarUrl, message: 'Avatar uploadé avec succès' })
})

// POST /api/upload/game-image - Upload d'une image de jeu
router.post('/game-image', uploadGameImage.single('image'), (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined
    if (!file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' })
    }

    const imageUrl = `/uploads/games/${file.filename}`
    res.json({ url: imageUrl, message: 'Image de jeu uploadée avec succès' })
})

// Gestion des erreurs Multer
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux (max 2MB)' })
        }
        return res.status(400).json({ error: err.message })
    }
    if (err) {
        return res.status(400).json({ error: err.message })
    }
    next()
})

export default router

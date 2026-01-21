# SecureApp — Application de Gestion de Festivals de Jeux

Application web fullstack pour la gestion de festivals de jeux de société : réservations, gestion des réservants (éditeurs, boutiques, particuliers), allocation des jeux sur les zones du festival, et planification des espaces.

## 🛠️ Stack Technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | Angular 20, Signals, RxJS, SCSS |
| **Backend** | Node.js, Express 5, TypeScript |
| **Base de données** | PostgreSQL 16 |
| **Auth** | JWT (HTTP-only cookies), bcrypt |
| **Infrastructure** | Docker, Docker Compose, Nginx |
| **Email** | Nodemailer (SMTP) |

## 🚀 Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Node.js 22+ (pour développement local)

### Développement (Docker)
```bash
# Démarrer l'environnement de dev
docker compose -f docker-compose.dev.yml up -d --build

# Vérifier le statut
docker compose -f docker-compose.dev.yml ps
```

**Accès :**
- Frontend : https://localhost:8080
- Backend API : https://localhost:4000
- Adminer (DB) : https://localhost:8081

### Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 🔐 Identifiants par défaut

| Rôle | Login | Mot de passe |
|------|-------|--------------|
| Admin | `admin` | `admin` |
| Utilisateur | `user` | `user` |

## 📁 Structure du projet

```
secure-app/
├── backend/                 # API Express + TypeScript
│   ├── src/
│   │   ├── routes/          # Endpoints REST
│   │   ├── middleware/      # Auth, validation
│   │   ├── services/        # Logique métier (email, etc.)
│   │   └── db/              # Connexion DB, migrations
│   └── db/                  # Scripts SQL, migrations
├── frontend/                # Application Angular
│   └── src/app/
│       ├── components/      # Composants UI
│       ├── services/        # Services HTTP
│       ├── stores/          # État (Signals)
│       ├── guards/          # Protection routes
│       └── types/           # DTOs TypeScript
├── docker-compose.*.yml     # Configs Docker (dev, prod, prodpol)
└── docs/                    # Documentation
```

## 🔄 Migrations

Les migrations s'appliquent automatiquement au démarrage du backend via `runMigrations()`.

Pour exécuter manuellement :
```bash
npm --prefix backend run build && node dist/db/migrations.js
```

## 📊 Import des données (Seed)

Import des jeux et éditeurs depuis les fichiers CSV :
```bash
npm --prefix backend run seed:uc-r4
```

## 🧪 Tests

```bash
# Frontend (354 tests)
npm --prefix frontend test

# Backend
npm --prefix backend test
```

## 📡 API Endpoints principaux

### Authentification
- `POST /api/auth/register` — Inscription
- `POST /api/auth/login` — Connexion
- `POST /api/auth/logout` — Déconnexion
- `POST /api/auth/refresh` — Rafraîchir le token
- `GET /api/auth/verify-email` — Vérification email

### Festivals
- `GET /api/festivals` — Liste des festivals
- `POST /api/festivals` — Créer un festival
- `GET /api/festivals/:id` — Détail d'un festival

### Réservants
- `GET /api/festivals/:festivalId/reservants` — Liste des réservants
- `POST /api/festivals/:festivalId/reservants` — Créer un réservant
- `DELETE /api/reservants/:id` — Supprimer avec résumé

### Jeux
- `GET /api/games` — Catalogue (filtres: title, type, editor_id, min_age)
- `POST /api/games` — Créer un jeu
- `DELETE /api/games/:id` — Supprimer (409 si utilisé)

### Zones & Plan
- `GET /api/festivals/:id/zones-plan` — Zones du festival
- `POST /api/zones-plan` — Créer une zone
- `PATCH /api/zones-plan/:id/allocate` — Allouer des jeux

## 🌐 Environnements & Accès Production

| Environnement | Fichier | URL |
|---------------|---------|-----|
| Dev | `docker-compose.dev.yml` | https://localhost:8080 |
| **VPS Romaric** | `docker-compose.prod.yml` | https://awi.romdev.cloud |
| **VPS Polytech** | `docker-compose.prodpol.yml` | https://162.38.111.46 |

**Accès direct aux sites déployés :**
- 🌍 **VPS Romaric** : [https://awi.romdev.cloud](https://awi.romdev.cloud)
- 🏫 **VPS Polytech** : [https://162.38.111.46](https://162.38.111.46)

## ⚙️ Variables d'environnement

Copier `backend/.env.example` vers `backend/.env` et configurer :

```env
DATABASE_URL=postgresql://user:pass@db:5432/secureapp
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

## 🛑 Arrêt / Nettoyage

```bash
# Arrêter les conteneurs
docker compose -f docker-compose.dev.yml down

# Supprimer les volumes (⚠️ perte de données)
docker compose -f docker-compose.dev.yml down -v
```

## 👥 Équipe

Projet AWI — IG4 Polytech Montpellier

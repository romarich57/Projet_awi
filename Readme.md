# SecureApp — Lancement en production (Docker)

## Démarrage
Depuis la racine du projet :
```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

## Identifiants de connexion
- **Utilisateur** : login `user` / mot de passe : user
- **Admin** : login `admin` / mot de passe `admin`

## Arrêt / Nettoyage
```bash
# Arrêter les conteneurs
docker compose -f docker-compose.prod.yml down --remove-orphans
```

## UC-R4 : Jeux et mécanismes

### Migrations
- Le schéma Postgres inclut désormais les colonnes `logo_url`, `is_exhibitor`, `is_distributor` sur `editor` et les champs étendus sur `games` (`min_players`, `max_players`, `prototype`, `duration_minutes`, `theme`, `description`, `image_url`, `rules_video_url`).
- Nouvelles tables : `mechanism`, `game_mechanism` et contrainte `UNIQUE (reservation_id, game_id)` sur `jeux_alloues` avec `ON DELETE RESTRICT` sur `game_id`.
- Au démarrage, `runMigrations()` applique ces changements ; pour lancer manuellement : `npm --prefix backend run build && node dist/db/migrations.js` ou exécuter les fichiers SQL de `backend/db/migrations`.

### Seed CSV
- Les CSV du client sont importés via `npm --prefix backend run seed:uc-r4` (idempotent, corrige les séquences).
- Les IDs fournis sont conservés (`idEditeur` → `editor.id`, `idJeu` → `games.id`).
- Les emails éditeurs sont générés en `slug@dummy-editor.local`.

### Endpoints principaux
- `GET /api/games` (+filtres `title`, `type`, `editor_id`, `min_age`), `GET /api/games/:id`
- `POST /api/games`, `PATCH /api/games/:id`, `DELETE /api/games/:id` (erreur 409 si jeu utilisé)
- `GET /api/mechanisms`, `GET /api/games/:id/mechanisms`
- `GET|POST /api/festivals/:festivalId/reservants/:reservantId/games`
- `PATCH|DELETE /api/jeux_alloues/:id`
- `GET /api/editors` pour alimenter les formulaires de jeux

### Frontend
- Nouvelle page `/games` : catalogue des jeux avec filtres, création/édition, gestion des mécanismes et suppression sécurisée.
- Nouvelle section “Jeux de ce réservant” dans la fiche réservant : charger un festival via son ID, ajouter/modifier/supprimer les jeux alloués (pas de notion de festival courant automatique).

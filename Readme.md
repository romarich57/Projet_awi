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

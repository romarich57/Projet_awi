#!/bin/bash

# Script de migration pour appliquer les changements sans perdre les données
# Usage: ./migrate.sh

set -e

echo "🔄 Application de la migration de la base de données..."

# Récupérer les informations de connexion depuis le .env ou les variables d'environnement
POSTGRES_USER=${POSTGRES_USER:-secureapp}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-secureapp}
POSTGRES_DB=${POSTGRES_DB:-secureapp}
CONTAINER_NAME=${CONTAINER_NAME:-secureapp_db_prod}

# Vérifier si le conteneur est en cours d'exécution
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas en cours d'exécution"
    exit 1
fi

echo "📊 Connexion à la base de données..."

# Appliquer la migration
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'EOF'
-- Migration: Ajout du type table_type_enum si il n'existe pas
-- Date: 2025-11-24

-- Créer le type ENUM si il n'existe pas
DO $$ BEGIN
    CREATE TYPE table_type_enum AS ENUM ('standard', 'grande', 'mairie');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type table_type_enum existe déjà, passage...';
END $$;

-- Créer la table jeux_alloues si elle n'existe pas
CREATE TABLE IF NOT EXISTS jeux_alloues (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    reservation_id INTEGER REFERENCES reservation(id),
    zone_plan_id INTEGER REFERENCES zone_plan(id),
    nb_tables_occupees NUMERIC NOT NULL,
    nb_exemplaires NUMERIC NOT NULL,
    taille_table_requise table_type_enum NOT NULL DEFAULT 'standard'
);

-- Créer la table reservation_zones_tarifaires si elle n'existe pas
CREATE TABLE IF NOT EXISTS reservation_zones_tarifaires (
    reservation_id INTEGER REFERENCES reservation(id),
    zone_tarifaire_id INTEGER REFERENCES zone_tarifaire(id),
    nb_tables_reservees INTEGER NOT NULL,
    PRIMARY KEY (reservation_id, zone_tarifaire_id)
);

-- Vérifier que tout s'est bien passé
\dt jeux_alloues
\dt reservation_zones_tarifaires
\dT+ table_type_enum

EOF

if [ $? -eq 0 ]; then
    echo "✅ Migration appliquée avec succès!"
else
    echo "❌ Erreur lors de l'application de la migration"
    exit 1
fi

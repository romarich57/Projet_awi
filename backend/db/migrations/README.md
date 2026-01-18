<!-- // Role : Documentation des migrations. -->
# Migrations de la base de données

## Migration 002: Ajout du type table_type_enum

### Description
Cette migration ajoute le type ENUM `table_type_enum` et crée les tables manquantes sans perdre les données existantes.

### Application de la migration sur le VPS

#### Méthode 1: Avec le script automatisé (recommandé)
```bash
# Se placer dans le répertoire du projet
cd /path/to/secure-app

# Exécuter le script de migration
./backend/db/migrate.sh
```

#### Méthode 2: Manuellement avec Docker
```bash
# Copier le fichier de migration dans le conteneur
docker cp backend/db/migrations/002_add_table_type_enum.sql secureapp_db_prod:/tmp/

# Exécuter la migration
docker exec -i secureapp_db_prod psql -U secureapp -d secureapp -f /tmp/002_add_table_type_enum.sql
```

#### Méthode 3: Directement en ligne de commande
```bash
docker exec -i secureapp_db_prod psql -U secureapp -d secureapp << 'EOF'
DO $$ BEGIN
    CREATE TYPE table_type_enum AS ENUM ('standard', 'grande', 'mairie');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS jeux_alloues (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    reservation_id INTEGER REFERENCES reservation(id),
    zone_plan_id INTEGER REFERENCES zone_plan(id),
    nb_tables_occupees NUMERIC NOT NULL,
    nb_exemplaires NUMERIC NOT NULL,
    taille_table_requise table_type_enum NOT NULL DEFAULT 'standard'
);

CREATE TABLE IF NOT EXISTS reservation_zones_tarifaires (
    reservation_id INTEGER REFERENCES reservation(id),
    zone_tarifaire_id INTEGER REFERENCES zone_tarifaire(id),
    nb_tables_reservees INTEGER NOT NULL,
    PRIMARY KEY (reservation_id, zone_tarifaire_id)
);
EOF
```

### Vérification
Pour vérifier que la migration s'est bien passée :
```bash
docker exec -it secureapp_db_prod psql -U secureapp -d secureapp -c "\dT+ table_type_enum"
docker exec -it secureapp_db_prod psql -U secureapp -d secureapp -c "\dt jeux_alloues"
docker exec -it secureapp_db_prod psql -U secureapp -d secureapp -c "\dt reservation_zones_tarifaires"
```

### Rollback
Si vous devez annuler cette migration :
```bash
docker exec -i secureapp_db_prod psql -U secureapp -d secureapp << 'EOF'
DROP TABLE IF EXISTS reservation_zones_tarifaires CASCADE;
DROP TABLE IF EXISTS jeux_alloues CASCADE;
DROP TYPE IF EXISTS table_type_enum CASCADE;
EOF
```

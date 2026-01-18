-- // Migration : ajout du type table_type_enum s'il n'existe pas
-- // Date : 2025-11-24

-- // Creer le type ENUM s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE table_type_enum AS ENUM ('standard', 'grande', 'mairie', 'aucun');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- // Creer la table jeux_alloues si elle n'existe pas
CREATE TABLE IF NOT EXISTS jeux_alloues (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    reservation_id INTEGER REFERENCES reservation(id),
    zone_plan_id INTEGER REFERENCES zone_plan(id),
    nb_tables_occupees NUMERIC NOT NULL,
    nb_exemplaires NUMERIC NOT NULL,
    taille_table_requise table_type_enum NOT NULL DEFAULT 'standard'
);

-- // Creer la table reservation_zones_tarifaires si elle n'existe pas
CREATE TABLE IF NOT EXISTS reservation_zones_tarifaires (
    reservation_id INTEGER REFERENCES reservation(id),
    zone_tarifaire_id INTEGER REFERENCES zone_tarifaire(id),
    nb_tables_reservees INTEGER NOT NULL,
    nb_chaises_reservees INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (reservation_id, zone_tarifaire_id)
);

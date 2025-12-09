CREATE TYPE role_enum AS ENUM ('normal', 'organizer', 'super-organizer', 'admin');

CREATE TYPE workflow_enum AS ENUM (
    'Pas_de_contact', 'Contact_pris', 'Discussion_en_cours', 
    'Sera_absent', 'Considere_absent', 'Reservation_confirmee', 
    'Facture', 'Facture_payee'
);

CREATE TYPE table_type_enum AS ENUM ('standard', 'grande', 'mairie');

CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY,
 login TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role role_enum DEFAULT 'normal',
 first_name TEXT,
 last_name TEXT,
 email TEXT UNIQUE NOT NULL,
 phone TEXT,
 avatar_url TEXT,
 email_verified BOOLEAN DEFAULT FALSE,
 email_verification_token TEXT,
 email_verification_expires_at TIMESTAMP,
 password_reset_token TEXT,
 password_reset_expires_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS festival (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    stock_tables_standard INTEGER NOT NULL DEFAULT 0,
    stock_tables_grande INTEGER NOT NULL DEFAULT 0,
    stock_tables_mairie INTEGER NOT NULL DEFAULT 0,
    stock_chaises INTEGER NOT NULL DEFAULT 0
);

-- Table des Éditeurs (créateurs de jeux)
CREATE TABLE IF NOT EXISTS Editor(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    is_exhibitor BOOLEAN NOT NULL DEFAULT false,
    is_distributor BOOLEAN NOT NULL DEFAULT false
);

-- Table des Réservants (entités qui réservent des espaces)
CREATE TYPE reservant_type_enum AS ENUM ('editeur', 'prestataire', 'boutique', 'animateur', 'association');

CREATE TABLE IF NOT EXISTS reservant(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    type reservant_type_enum NOT NULL,
    editor_id INTEGER REFERENCES Editor(id), -- NULL si le réservant n'est pas un éditeur
    phone_number TEXT,
    address TEXT,
    siret TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS contact (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    job_title TEXT NOT NULL,
    editor_id INTEGER REFERENCES Editor(id), -- Contact d'un éditeur
    reservant_id INTEGER REFERENCES reservant(id), -- Contact d'un réservant
    priority INTEGER NOT NULL,
    CONSTRAINT contact_entity_check CHECK (
        (editor_id IS NOT NULL AND reservant_id IS NULL) OR
        (editor_id IS NULL AND reservant_id IS NOT NULL)
    ) -- Un contact appartient soit à un éditeur, soit à un réservant
);


CREATE TABLE IF NOT EXISTS games(
    id SERIAL PRIMARY KEY,
    title TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    editor_id INTEGER REFERENCES Editor(id) ON DELETE RESTRICT,
    min_age INTEGER NOT NULL,
    authors TEXT NOT NULL,
    min_players INTEGER,
    max_players INTEGER,
    prototype BOOLEAN NOT NULL DEFAULT false,
    duration_minutes INTEGER,
    theme TEXT,
    description TEXT,
    image_url TEXT,
    rules_video_url TEXT
);

CREATE TABLE IF NOT EXISTS mechanism(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS game_mechanism(
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    mechanism_id INTEGER NOT NULL REFERENCES mechanism(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, mechanism_id)
);

CREATE TABLE IF NOT EXISTS zone_tarifaire(
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    festival_id INTEGER REFERENCES festival(id),
    nb_tables INTEGER NOT NULL,
    nb_tables_available INTEGER NOT NULL DEFAULT 0,
    price_per_table NUMERIC NOT NULL,
    m2_price NUMERIC NOT NULL,
    UNIQUE(festival_id, name)
);

ALTER TABLE zone_tarifaire
    ADD COLUMN IF NOT EXISTS nb_tables_available INTEGER NOT NULL DEFAULT 0;

UPDATE zone_tarifaire
SET nb_tables_available = nb_tables
WHERE nb_tables_available IS NULL;

CREATE TABLE IF NOT EXISTS zone_plan (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    festival_id INTEGER REFERENCES festival(id),
    id_zone_tarifaire INTEGER REFERENCES zone_tarifaire(id),
    nb_tables INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS suivi_workflow ( --ca correspond au workflow par réservant et par festival
    id SERIAL PRIMARY KEY,
    reservant_id INTEGER NOT NULL REFERENCES reservant(id),
    festival_id INTEGER NOT NULL REFERENCES festival(id),
    state workflow_enum NOT NULL DEFAULT 'Pas_de_contact',
    liste_jeux_demandee BOOLEAN NOT NULL DEFAULT false,
    liste_jeux_obtenue BOOLEAN NOT NULL DEFAULT false,
    jeux_recus BOOLEAN NOT NULL DEFAULT false,
    presentera_jeux BOOLEAN NOT NULL DEFAULT true,

    UNIQUE(reservant_id, festival_id) -- Un seul workflow par réservant et par festival
);

CREATE TABLE IF NOT EXISTS reservation ( 
    id SERIAL PRIMARY KEY,
    reservant_id INTEGER REFERENCES reservant(id),
    festival_id INTEGER REFERENCES festival(id),
    workflow_id INTEGER REFERENCES suivi_workflow(id),
    start_price NUMERIC NOT NULL,
    table_discount_offered NUMERIC NOT NULL,
    direct_discount NUMERIC NOT NULL,
    nb_prises INTEGER NOT NULL,
    date_facturation DATE,
    final_price NUMERIC NOT NULL,
    statut_paiment TEXT CHECK (statut_paiment IN ('non_payé', 'payé')) NOT NULL DEFAULT 'non_payé',
    note TEXT,
    UNIQUE(reservant_id, festival_id) -- Un réservant ne peut avoir qu'une réservation par festival
);


CREATE TABLE IF NOT EXISTS suivi_contact (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contact(id),
    workflow_id INTEGER REFERENCES suivi_workflow(id),
    date_contact TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS jeux_alloues (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE RESTRICT,
    reservation_id INTEGER REFERENCES reservation(id),
    zone_plan_id INTEGER REFERENCES zone_plan(id),
    nb_tables_occupees NUMERIC NOT NULL,
    nb_exemplaires NUMERIC NOT NULL,
    taille_table_requise table_type_enum NOT NULL DEFAULT 'standard',
    UNIQUE (reservation_id, game_id)
);

-- Nouvelle table de liaison pour les réservations et zones tarifaires
CREATE TABLE IF NOT EXISTS reservation_zones_tarifaires (
    reservation_id INTEGER REFERENCES reservation(id),
    zone_tarifaire_id INTEGER REFERENCES zone_tarifaire(id),
    nb_tables_reservees INTEGER NOT NULL,
    PRIMARY KEY (reservation_id, zone_tarifaire_id)
);

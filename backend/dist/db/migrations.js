import pool from './database.js';
export async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('🔄 Exécution des migrations de la base de données...');
        // Migration 002: Ajout du type table_type_enum
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE table_type_enum AS ENUM ('standard', 'grande', 'mairie');
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'Type table_type_enum existe déjà, passage...';
      END $$;
    `);
        console.log('✅ Type table_type_enum vérifié/créé');
        // S'assurer que la table festival existe (certains environnements n'ont pas appliqué init.sql)
        await client.query(`
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
    `);
        console.log('✅ Table festival vérifiée/créée');
        // Types et tables de base pour les réservations (rattrapage si init.sql non appliqué)
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE role_enum AS ENUM ('normal', 'organizer', 'super-organizer', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE workflow_enum AS ENUM (
          'Pas_de_contact', 'Contact_pris', 'Discussion_en_cours',
          'Sera_absent', 'Considere_absent', 'Reservation_confirmee',
          'Facture', 'Facture_payee'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
        await client.query(`
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
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS editor (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        website TEXT,
        description TEXT,
        logo_url TEXT,
        is_exhibitor BOOLEAN NOT NULL DEFAULT false,
        is_distributor BOOLEAN NOT NULL DEFAULT false
      );
    `);
        await client.query(`
      ALTER TABLE editor
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS is_exhibitor BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_distributor BOOLEAN NOT NULL DEFAULT false;
    `);
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE reservant_type_enum AS ENUM ('editeur', 'prestataire', 'boutique', 'animateur', 'association');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS reservant (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        type reservant_type_enum NOT NULL,
        editor_id INTEGER REFERENCES editor(id),
        phone_number TEXT,
        address TEXT,
        siret TEXT,
        notes TEXT
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        job_title TEXT NOT NULL,
        editor_id INTEGER REFERENCES editor(id),
        reservant_id INTEGER REFERENCES reservant(id),
        priority INTEGER NOT NULL,
        CONSTRAINT contact_entity_check CHECK (
          (editor_id IS NOT NULL AND reservant_id IS NULL) OR
          (editor_id IS NULL AND reservant_id IS NOT NULL)
        )
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        editor_id INTEGER REFERENCES editor(id) ON DELETE RESTRICT,
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
    `);
        await client.query(`
      ALTER TABLE games
        ADD COLUMN IF NOT EXISTS min_players INTEGER,
        ADD COLUMN IF NOT EXISTS max_players INTEGER,
        ADD COLUMN IF NOT EXISTS prototype BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS theme TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS rules_video_url TEXT;
    `);
        // Table zone_tarifaire liée à festival
        await client.query(`
      CREATE TABLE IF NOT EXISTS zone_tarifaire (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        festival_id INTEGER REFERENCES festival(id) ON DELETE CASCADE,
        nb_tables INTEGER NOT NULL,
        nb_tables_available INTEGER NOT NULL DEFAULT 0,
        price_per_table NUMERIC NOT NULL,
        m2_price NUMERIC NOT NULL,
        UNIQUE(festival_id, name)
      );
    `);
        await client.query(`UPDATE zone_tarifaire SET nb_tables_available = nb_tables WHERE nb_tables_available IS NULL;`);
        console.log('✅ Table zone_tarifaire vérifiée/créée');
        await client.query(`
      CREATE TABLE IF NOT EXISTS zone_plan (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        festival_id INTEGER REFERENCES festival(id),
        id_zone_tarifaire INTEGER REFERENCES zone_tarifaire(id),
        nb_tables INTEGER NOT NULL
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS suivi_workflow (
        id SERIAL PRIMARY KEY,
        reservant_id INTEGER NOT NULL REFERENCES reservant(id),
        festival_id INTEGER NOT NULL REFERENCES festival(id),
        state workflow_enum NOT NULL DEFAULT 'Pas_de_contact',
        liste_jeux_demandee BOOLEAN NOT NULL DEFAULT false,
        liste_jeux_obtenue BOOLEAN NOT NULL DEFAULT false,
        jeux_recus BOOLEAN NOT NULL DEFAULT false,
        presentera_jeux BOOLEAN NOT NULL DEFAULT true,
        UNIQUE(reservant_id, festival_id)
      );
    `);
        await client.query(`
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
        statut_paiement TEXT CHECK (statut_paiement IN ('non_payé', 'payé')) NOT NULL DEFAULT 'non_payé',
        note TEXT,
        UNIQUE(reservant_id, festival_id)
      );
    `);
        // Créer la table jeux_alloues si elle n'existe pas
        await client.query(`
      CREATE TABLE IF NOT EXISTS jeux_alloues (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        reservation_id INTEGER REFERENCES reservation(id),
        zone_plan_id INTEGER REFERENCES zone_plan(id),
        nb_tables_occupees NUMERIC NOT NULL,
        nb_exemplaires NUMERIC NOT NULL,
        taille_table_requise table_type_enum NOT NULL DEFAULT 'standard',
        UNIQUE (reservation_id, game_id)
      );
    `);
        await client.query(`
      ALTER TABLE jeux_alloues
        DROP CONSTRAINT IF EXISTS jeux_alloues_game_id_fkey;
      ALTER TABLE jeux_alloues
        ADD CONSTRAINT jeux_alloues_game_id_fkey
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT;
    `);
        await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'jeux_alloues_reservation_id_game_id_key'
        ) THEN
          ALTER TABLE jeux_alloues
            ADD CONSTRAINT jeux_alloues_reservation_id_game_id_key UNIQUE (reservation_id, game_id);
        END IF;
      END $$;
    `);
        console.log('✅ Table jeux_alloues vérifiée/créée');
        // Créer la table reservation_zones_tarifaires si elle n'existe pas
        await client.query(`
      CREATE TABLE IF NOT EXISTS reservation_zones_tarifaires (
        reservation_id INTEGER REFERENCES reservation(id),
        zone_tarifaire_id INTEGER REFERENCES zone_tarifaire(id),
        nb_tables_reservees INTEGER NOT NULL,
        PRIMARY KEY (reservation_id, zone_tarifaire_id)
      );
    `);
        console.log('✅ Table reservation_zones_tarifaires vérifiée/créée');
        // Mécanismes et liaisons
        await client.query(`
      CREATE TABLE IF NOT EXISTS mechanism(
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS game_mechanism(
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        mechanism_id INTEGER NOT NULL REFERENCES mechanism(id) ON DELETE CASCADE,
        PRIMARY KEY (game_id, mechanism_id)
      );
    `);
        console.log('✅ Tables mechanism et game_mechanism vérifiées/créées');
        console.log('✅ Toutes les migrations ont été appliquées avec succès');
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'exécution des migrations:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=migrations.js.map
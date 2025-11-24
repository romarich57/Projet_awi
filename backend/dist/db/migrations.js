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
        // Créer la table jeux_alloues si elle n'existe pas
        await client.query(`
      CREATE TABLE IF NOT EXISTS jeux_alloues (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        reservation_id INTEGER REFERENCES reservation(id),
        zone_plan_id INTEGER REFERENCES zone_plan(id),
        nb_tables_occupees NUMERIC NOT NULL,
        nb_exemplaires NUMERIC NOT NULL,
        taille_table_requise table_type_enum NOT NULL DEFAULT 'standard'
      );
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
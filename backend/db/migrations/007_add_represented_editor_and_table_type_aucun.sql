-- Migration: Ajout de represented_editor_id et du type "aucun" pour les tables
-- Date: 2025-12-05

-- Ajouter la valeur "aucun" au type ENUM si elle n'existe pas
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'aucun'
          AND enumtypid = 'table_type_enum'::regtype
    ) THEN
        ALTER TYPE table_type_enum ADD VALUE 'aucun';
    END IF;
END $$;

-- Ajouter la colonne represented_editor_id sur reservation
ALTER TABLE reservation
    ADD COLUMN IF NOT EXISTS represented_editor_id INTEGER REFERENCES reservant(id);

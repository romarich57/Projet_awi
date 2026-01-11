-- Migration: Supprimer le rôle 'visiteur' et convertir les utilisateurs existants en 'benevole'
-- Date: 2026-01-11

-- Étape 1: Convertir tous les utilisateurs avec le rôle 'visiteur' en 'benevole'
-- Utiliser une conversion via text pour éviter les erreurs si l'enum est déjà mis à jour
DO $$ 
BEGIN
  -- Convertir les utilisateurs visiteur en benevole si la colonne est de type text temporairement
  UPDATE users SET role = 'benevole'::role_enum 
  WHERE role::text = 'visiteur';
EXCEPTION 
  WHEN others THEN
    -- Si l'enum ne contient plus 'visiteur', cela échouera silencieusement
    RAISE NOTICE 'La valeur visiteur n''existe plus dans l''enum ou aucune donnée à migrer';
END $$;

-- Étape 2: Changer la valeur par défaut de la colonne role
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'benevole';

-- Étape 3: Recréer l'enum sans 'visiteur' si nécessaire
-- PostgreSQL ne permet pas de supprimer une valeur d'un enum directement,
-- donc on doit recréer l'enum

DO $$
BEGIN
  -- Vérifier si l'enum contient encore 'visiteur'
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'role_enum'::regtype 
    AND enumlabel = 'visiteur'
  ) THEN
    -- 3a. Créer le nouvel enum
    CREATE TYPE role_enum_new AS ENUM ('benevole', 'organizer', 'super-organizer', 'admin');

    -- 3b. Supprimer la contrainte par défaut temporairement
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

    -- 3c. Convertir la colonne vers le nouvel enum
    ALTER TABLE users 
      ALTER COLUMN role TYPE role_enum_new 
      USING role::text::role_enum_new;

    -- 3d. Supprimer l'ancien enum
    DROP TYPE role_enum;

    -- 3e. Renommer le nouvel enum
    ALTER TYPE role_enum_new RENAME TO role_enum;

    -- 3f. Rétablir la valeur par défaut
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'benevole';
    
    RAISE NOTICE 'Enum role_enum recréé sans visiteur';
  ELSE
    RAISE NOTICE 'L''enum role_enum ne contient déjà plus visiteur';
  END IF;
END $$;

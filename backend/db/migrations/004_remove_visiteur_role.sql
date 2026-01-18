-- // Migration : supprimer le role 'visiteur' et convertir les utilisateurs existants en 'benevole'
-- // Date : 2026-01-11

-- // Etape 1 : convertir tous les utilisateurs avec le role 'visiteur' en 'benevole'
-- // Utiliser une conversion via text pour eviter les erreurs si l'enum est deja mis a jour
DO $$ 
BEGIN
  -- // Convertir les utilisateurs visiteur en benevole si la colonne est de type text temporairement
  UPDATE users SET role = 'benevole'::role_enum 
  WHERE role::text = 'visiteur';
EXCEPTION 
  WHEN others THEN
    -- // Si l'enum ne contient plus 'visiteur', cela echouera silencieusement
    RAISE NOTICE 'La valeur visiteur n''existe plus dans l''enum ou aucune donnée à migrer';
END $$;

-- // Etape 2 : changer la valeur par defaut de la colonne role
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'benevole';

-- // Etape 3 : recreer l'enum sans 'visiteur' si necessaire
-- // PostgreSQL ne permet pas de supprimer une valeur d'un enum directement,
-- // donc on doit recreer l'enum

DO $$
BEGIN
  -- // Verifier si l'enum contient encore 'visiteur'
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'role_enum'::regtype 
    AND enumlabel = 'visiteur'
  ) THEN
    -- // 3a. Creer le nouvel enum
    CREATE TYPE role_enum_new AS ENUM ('benevole', 'organizer', 'super-organizer', 'admin');

    -- // 3b. Supprimer la contrainte par defaut temporairement
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

    -- // 3c. Convertir la colonne vers le nouvel enum
    ALTER TABLE users 
      ALTER COLUMN role TYPE role_enum_new 
      USING role::text::role_enum_new;

    -- // 3d. Supprimer l'ancien enum
    DROP TYPE role_enum;

    -- // 3e. Renommer le nouvel enum
    ALTER TYPE role_enum_new RENAME TO role_enum;

    -- // 3f. Retablir la valeur par defaut
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'benevole';
    
    RAISE NOTICE 'Enum role_enum recréé sans visiteur';
  ELSE
    RAISE NOTICE 'L''enum role_enum ne contient déjà plus visiteur';
  END IF;
END $$;

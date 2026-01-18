-- // Migration UC-R4 : enrichissement jeux/editeurs et mecanismes

-- // Colonnes supplementaires pour les editeurs
ALTER TABLE editor
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_exhibitor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_distributor BOOLEAN NOT NULL DEFAULT false;

-- // Colonnes supplementaires pour les jeux
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS min_players INTEGER,
  ADD COLUMN IF NOT EXISTS max_players INTEGER,
  ADD COLUMN IF NOT EXISTS prototype BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS rules_video_url TEXT;

-- // Table des mecanismes
CREATE TABLE IF NOT EXISTS mechanism(
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- // Table de liaison jeux <-> mecanismes
CREATE TABLE IF NOT EXISTS game_mechanism(
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mechanism_id INTEGER NOT NULL REFERENCES mechanism(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, mechanism_id)
);

-- // Empecher la suppression d'un jeu alloue a une reservation
ALTER TABLE jeux_alloues
  DROP CONSTRAINT IF EXISTS jeux_alloues_game_id_fkey;
ALTER TABLE jeux_alloues
  ADD CONSTRAINT jeux_alloues_game_id_fkey
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jeux_alloues_reservation_id_game_id_key'
  ) THEN
    ALTER TABLE jeux_alloues
      ADD CONSTRAINT jeux_alloues_reservation_id_game_id_key UNIQUE (reservation_id, game_id);
  END IF;
END $$;

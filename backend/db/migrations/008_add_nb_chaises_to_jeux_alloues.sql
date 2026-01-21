-- Migration : Ajout de la colonne nb_chaises à la table jeux_alloues
ALTER TABLE jeux_alloues ADD COLUMN IF NOT EXISTS nb_chaises INTEGER NOT NULL DEFAULT 0;

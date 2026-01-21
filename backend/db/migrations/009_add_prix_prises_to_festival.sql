-- 008_add_prix_prises_to_festival.sql
-- Ajoute la colonne prix_prises à la table festival

ALTER TABLE festival ADD COLUMN prix_prises NUMERIC NOT NULL DEFAULT 0;
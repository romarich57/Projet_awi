-- Migration: Ajouter la gestion des chaises aux zones de plan
-- Description: Permet d'allouer des chaises aux zones de plan pour les réservations

-- Ajouter la colonne nb_chaises à reservation_zone_plan
ALTER TABLE reservation_zone_plan 
ADD COLUMN IF NOT EXISTS nb_chaises INTEGER NOT NULL DEFAULT 0;

-- Commentaire pour documentation
COMMENT ON COLUMN reservation_zone_plan.nb_chaises IS 'Nombre de chaises allouées pour cette réservation dans cette zone de plan';

-- Ajout des colonnes manquantes à reservation_zones_tarifaires

-- 1. Ajouter le mode de paiement
ALTER TABLE reservation_zones_tarifaires
ADD COLUMN IF NOT EXISTS mode_paiement TEXT 
  CHECK (mode_paiement IN ('table', 'm2')) DEFAULT 'table';

-- 2. Ajouter les colonnes pour les types de tables
ALTER TABLE reservation_zones_tarifaires
ADD COLUMN IF NOT EXISTS nb_tables_standard INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nb_tables_grande INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nb_tables_mairie INTEGER DEFAULT 0;

-- 3. Ajouter les chaises
ALTER TABLE reservation_zones_tarifaires
ADD COLUMN IF NOT EXISTS nb_chaises INTEGER DEFAULT 0;

-- 4. Ajouter la surface (pour mode m²)
ALTER TABLE reservation_zones_tarifaires
ADD COLUMN IF NOT EXISTS surface_m2 NUMERIC DEFAULT 0;

-- 5. Ajouter le prix calculé (optionnel mais utile)
ALTER TABLE reservation_zones_tarifaires
ADD COLUMN IF NOT EXISTS prix_calcule NUMERIC DEFAULT 0;

-- 6. La colonne nb_tables_reservees devient redondante
-- On peut la garder pour compatibilité OU la supprimer
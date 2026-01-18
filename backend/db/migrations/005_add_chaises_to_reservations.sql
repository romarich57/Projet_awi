-- // Migration : ajouter la gestion des chaises dans les reservations
-- // Date : 2026-01-11

-- // Etape 1 : ajouter la colonne nb_chaises_reservees dans reservation_zones_tarifaires
ALTER TABLE reservation_zones_tarifaires 
    ADD COLUMN IF NOT EXISTS nb_chaises_reservees INTEGER NOT NULL DEFAULT 0;

-- // Etape 2 : ajouter une colonne pour le stock de chaises disponibles dans festival
-- // (stock_chaises existe deja, on ajoute stock_chaises_available)
ALTER TABLE festival 
    ADD COLUMN IF NOT EXISTS stock_chaises_available INTEGER NOT NULL DEFAULT 0;

-- // Initialiser le stock disponible avec le stock total pour les festivals existants
UPDATE festival 
SET stock_chaises_available = stock_chaises 
WHERE stock_chaises_available = 0 AND stock_chaises > 0;

-- // Etape 3 : creer une vue pour faciliter le calcul du stock de chaises restant
-- // Le stock de chaises est global par festival (pas par zone tarifaire)
CREATE OR REPLACE VIEW festival_stock_chaises AS
SELECT 
    f.id as festival_id,
    f.name as festival_name,
    f.stock_chaises as total_chaises,
    f.stock_chaises_available as available_chaises,
    COALESCE(SUM(rzt.nb_chaises_reservees), 0) as reserved_chaises
FROM festival f
LEFT JOIN reservation r ON f.id = r.festival_id
LEFT JOIN reservation_zones_tarifaires rzt ON r.id = rzt.reservation_id
GROUP BY f.id, f.name, f.stock_chaises, f.stock_chaises_available;

const M2_PAR_TABLE = 4; // selon la consigne

/**
 * Calcule le prix brut d'une réservation
 */
export function calculerPrixBrutReservation(zones: any[], zonesTarifaires: any[]): { prixTotal: number; totalChaises: number } {
  // Validation basique
  if (!zones || zones.length === 0) {
    throw new Error('Au moins une zone tarifaire est requise');
  }
  
  let prixTotal = 0;
  let totalChaises = 0;
  
  for (const zone of zones) {
    // Trouver la zone tarifaire correspondante
    const zoneTarifaire = zonesTarifaires.find(z => z.id === zone.zone_tarifaire_id);
    
    if (!zoneTarifaire) {
      throw new Error(`Zone tarifaire ${zone.zone_tarifaire_id} non trouvée`);
    }
    
    // Validation du mode
    if (!zone.mode_paiement || (zone.mode_paiement !== 'table' && zone.mode_paiement !== 'm2')) {
      throw new Error(`Mode de paiement invalide pour la zone ${zone.zone_tarifaire_id}`);
    }
    
    if (zone.mode_paiement === 'table') {
      // MODE TABLE
      const nb_tables_standard = zone.nb_tables_standard || 0;
      const nb_tables_grande = zone.nb_tables_grande || 0;
      const nb_tables_mairie = zone.nb_tables_mairie || 0;
      const nb_chaises = zone.nb_chaises || 0;
      
      const totalTables = nb_tables_standard + nb_tables_grande + nb_tables_mairie;
      
      if (totalTables === 0) {
        throw new Error('En mode "table", au moins une table est requise');
      }
      
      // Calcul prix
      prixTotal += totalTables * zoneTarifaire.price_per_table;
      totalChaises += nb_chaises;
      
    } else {
      // MODE M²
      const surface_m2 = zone.surface_m2 || 0;
      
      if (surface_m2 <= 0) {
        throw new Error('En mode "m2", une surface positive est requise');
      }
      
      // Calcul prix
      prixTotal += surface_m2 * zoneTarifaire.m2_price;
    }
  }
  
  return { prixTotal, totalChaises };
}
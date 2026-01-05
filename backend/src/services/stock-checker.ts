const M2_PAR_TABLE = 4;

/**
 * Vérifie si le stock est suffisant pour une réservation
 */
export function verifierStockDisponible(zones: any[], zonesTarifaires: any[]): { success: boolean; message?: string } {
  // Créer une copie du stock pour simulation
  const stockSimulation = new Map();
  
  for (const zoneTarifaire of zonesTarifaires) {
    stockSimulation.set(zoneTarifaire.id, {
      disponible: zoneTarifaire.nb_tables_available,
      nom: zoneTarifaire.name
    });
  }
  
  for (const zone of zones) {
    const stockZone = stockSimulation.get(zone.zone_tarifaire_id);
    
    if (!stockZone) {
      return { 
        success: false, 
        message: `Zone tarifaire ${zone.zone_tarifaire_id} non trouvée` 
      };
    }
    
    // Calculer tables nécessaires
    let tablesNecessaires = 0;
    
    if (zone.mode_paiement === 'table') {
      tablesNecessaires = 
        (zone.nb_tables_standard || 0) + 
        (zone.nb_tables_grande || 0) + 
        (zone.nb_tables_mairie || 0);
    } else {
      // Mode m² : convertir en tables équivalentes
      tablesNecessaires = Math.ceil((zone.surface_m2 || 0) / M2_PAR_TABLE);
    }
    
    if (stockZone.disponible < tablesNecessaires) {
      return { 
        success: false, 
        message: `Stock insuffisant dans la zone "${stockZone.nom}". Disponible: ${stockZone.disponible}, Demandé: ${tablesNecessaires}` 
      };
    }
    
    // Réserver temporairement pour vérifier les zones multiples
    stockZone.disponible -= tablesNecessaires;
  }
  
  return { success: true };
}
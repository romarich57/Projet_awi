export interface ReservationZoneTarifaireDto {
    // reservation_id devient optionnel (pas dispo à la création)
    reservation_id?: number;
    
    zone_tarifaire_id: number;
    
    // NOUVEAU: Mode de paiement
    mode_paiement: 'table' | 'm2';
    
    // Pour compatibilité (mode table)
    nb_tables_reservees?: number;
    
    // NOUVEAU: Pour le mode m²
    surface_m2?: number;
    
    // Détails supplémentaires (optionnels, pour l'UI)
    nb_tables_standard?: number;
    nb_tables_grande?: number;
    nb_tables_mairie?: number;
    nb_chaises?: number;
}
import { ReservationZoneTarifaireDto } from './reservation-zone-tarifaire-dto';
export interface ReservationDto {
    id?: number;  // Optionnel à la création
    reservant_id: number;
    festival_id: number;
    workflow_id?: number;  // Optionnel, 1 par défaut
    start_price?: number;
    table_discount_offered?: number;
    direct_discount?: number;
    nb_prises?: number;
    date_facturation?: string;
    final_price?: number;
    statut_paiement?: 'non_payé' | 'payé';
    note?: string;
    
    // NOUVEAU: Zones tarifaires (optionnel à la création, obligatoire ?)
    zones?: ReservationZoneTarifaireDto[];
}
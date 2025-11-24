export interface ReservationDto {
    id: number;
    reservant_id: number;
    festival_id: number;
    workflow_id: number;
    start_price: number;
    table_discount_offered: number;
    direct_discount: number;
    nb_prises: number;
    date_facturation?: string;
    final_price: number;
    statut_paiment: 'non_payé' | 'payé';
    note?: string;
}
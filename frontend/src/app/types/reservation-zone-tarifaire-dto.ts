// Type : Decrit une reservation par zone tarifaire.
export interface ReservationZoneTarifaireDto {
    reservation_id: number;
    zone_tarifaire_id: number;
    nb_tables_reservees: number;
    nb_chaises_reservees: number;
}

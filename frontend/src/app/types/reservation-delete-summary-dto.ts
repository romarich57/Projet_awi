// Type : Decrit les dependances supprimees avec une reservation.
export interface ReservationDeleteSummaryDto {
  reservation_id: number;
  zones_tarifaires: Array<{
    zone_tarifaire_id: number;
    zone_name: string;
    nb_tables_reservees: number;
    nb_chaises_reservees: number;
  }>;
  zone_plan_allocations: Array<{
    zone_plan_id: number;
    zone_plan_name: string;
    nb_tables: number;
    nb_chaises: number;
  }>;
  games_allocations: Array<{
    id: number;
    game_id: number;
    game_title: string;
    nb_tables_occupees: number;
    nb_exemplaires: number;
    nb_chaises: number;
    zone_plan_id: number | null;
  }>;
}

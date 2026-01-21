import { ReservantDto } from './reservant-dto';

// Type : Decrit une reservation pour l'affichage du dashboard.
export interface ReservationDashboardRowDto {
  id: number;
  reservant_name: string;
  reservant_type: ReservantDto['type'];
  workflow_state: string;
}

// Type : Decrit le resume des dependances supprimees pour un reservant.
export interface ReservantDeleteSummaryDto {
  reservant_id: number;
  contacts: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  workflows: Array<{
    id: number;
    festival_id: number | null;
    festival_name: string | null;
    state: string;
  }>;
  reservations: Array<{
    id: number;
    festival_id: number | null;
    festival_name: string | null;
    statut_paiement: string;
    relation: 'reservant' | 'represented_editor';
  }>;
}

export type ReservantWorkflowState =
    | 'Pas_de_contact'
    | 'Contact_pris'
    | 'Discussion_en_cours'
    | 'Sera_absent'
    | 'Considere_absent'
    | 'Reservation_confirmee'
    | 'Facture'
    | 'Facture_payee';

export interface ReservantDto {
    id: number;
    name: string;
    email: string;
    type: 'editeur' | 'prestataire' | 'boutique' | 'animateur' | 'association';
    editor_id?: number; // ID de l'éditeur si le réservant est un éditeur
    phone_number?: string;
    address?: string;
    siret?: string;
    notes?: string;
    workflow_state: ReservantWorkflowState;
    liste_jeux_demandee?: boolean;
    liste_jeux_obtenue?: boolean;
    jeux_recus?: boolean;
    presentera_jeux?: boolean;
}

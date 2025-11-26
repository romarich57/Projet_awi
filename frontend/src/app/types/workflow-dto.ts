export interface WorkflowDto {
    id: number;
    reservant_id: number;
    festival_id: number;
    etatcourant: 'Pas_de_contact' | 'Contact_pris' | 'Discussion_en_cours' | 
           'Sera_absent' | 'Considere_absent' | 'Reservation_confirmee' | 
           'Facture' | 'Facture_payee';
    liste_jeux_demandee: boolean;
    liste_jeux_obtenue: boolean;
    jeux_recus: boolean;
    presentera_jeux: boolean;
}
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
}
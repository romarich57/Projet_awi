export interface ZoneTarifaireDto {
    id: number;
    name: string;
    festival_id: number;
    nb_tables: number;
    price_per_table: number;
    nb_tables_available: number;  // AJOUTEZ ce champ
    m2_price: number;
    description?: string;          // Optionnel
    is_active?: boolean;           // Optionnel avec valeur par défaut
    max_tables?: number;           // Optionnel
    max_m2?: number;               // Optionnel
}
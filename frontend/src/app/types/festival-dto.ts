// Type : Decrit la structure d'un festival.
export interface FestivalDto {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    stock_tables_standard: number;
    stock_tables_grande: number;
    stock_tables_mairie: number;
    stock_chaises: number;
    prix_prises: number;
}

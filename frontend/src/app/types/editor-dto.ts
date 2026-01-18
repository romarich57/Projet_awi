// Type : Decrit un editeur.
export interface EditorDto {
    id: number;
    name: string;
    email: string;
    website?: string | null;
    description?: string | null;
    logo_url?: string | null;
    is_exhibitor?: boolean;
    is_distributor?: boolean;
}

import type { MechanismDto } from './mechanism-dto';

export type TableSize = 'standard' | 'grande' | 'mairie' | 'aucun';

export interface AllocatedGameDto {
  allocation_id: number;
  reservation_id: number;
  game_id: number;
  nb_tables_occupees: number;
  nb_exemplaires: number;
  zone_plan_id: number | null;
  taille_table_requise: TableSize;
  title: string;
  type: string;
  editor_id: number | null;
  editor_name: string | null;
  min_age: number;
  authors: string;
  min_players?: number | null;
  max_players?: number | null;
  prototype: boolean;
  duration_minutes?: number | null;
  theme?: string | null;
  description?: string | null;
  image_url?: string | null;
  rules_video_url?: string | null;
  mechanisms?: MechanismDto[];
  zones_tarifaires_reservees?: number[];
}

export interface TableStockByType {
  table_type: TableSize;
  total: number;
  occupees: number;
  restantes: number;
}

export interface ZoneTableStock {
  festival_id: number;
  stock: TableStockByType[];
}

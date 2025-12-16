import type { MechanismDto } from './mechanism-dto';

export interface GameDto {
  id: number;
  title: string;
  type: string;
  editor_id: number | null;
  editor_name?: string | null;
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
}

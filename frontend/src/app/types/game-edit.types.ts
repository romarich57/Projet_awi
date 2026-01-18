// Type : Decrit le modele de formulaire pour l'edition d'un jeu.
export type GameFormModel = {
  title: string;
  type: string;
  editor_id: string;
  min_age: number | null;
  authors: string;
  min_players: number | null;
  max_players: number | null;
  prototype: boolean;
  duration_minutes: number | null;
  theme: string;
  description: string;
  image_url: string;
  rules_video_url: string;
  mechanismIds: number[];
};

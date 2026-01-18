// Type : Decrit les filtres de recherche pour la liste des jeux.
export type GamesFilters = {
  title: string;
  type: string;
  editorId: string;
  minAge: string;
};

// Type : Decrit la visibilite des colonnes sur la page des jeux.
export type GamesVisibleColumns = {
  type: boolean;
  editor: boolean;
  age: boolean;
  players: boolean;
  authors: boolean;
  mechanisms: boolean;
  theme: boolean;
  duration: boolean;
  prototype: boolean;
  description: boolean;
};

// Type : Decrit une option de colonne pour l'interface des jeux.
export type GamesColumnOption = {
  key: keyof GamesVisibleColumns;
  label: string;
};

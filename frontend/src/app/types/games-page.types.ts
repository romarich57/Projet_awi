export type GamesFilters = {
  title: string;
  type: string;
  editorId: string;
  minAge: string;
};

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

export type GamesColumnOption = {
  key: keyof GamesVisibleColumns;
  label: string;
};

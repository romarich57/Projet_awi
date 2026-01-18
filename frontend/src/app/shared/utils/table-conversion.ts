export const M2_PER_TABLE = 4.5;

// Role : Calculer le nombre de tables necessaires pour une surface donnee.
// Preconditions : m2 doit etre un nombre positif.
// Postconditions : Renvoie le nombre de tables arrondi a l'entier superieur.
export const m2ToTables = (m2: number): number => Math.ceil(m2 / M2_PER_TABLE);

// Role : Calculer la surface approximative occupee par un nombre de tables donne.
// Preconditions : tables doit etre un nombre positif.
// Postconditions : Renvoie la surface en m2.
export const tablesToM2 = (tables: number): number => tables * M2_PER_TABLE;

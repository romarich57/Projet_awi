export const M2_PER_TABLE = 4.5;

export const m2ToTables = (m2: number): number => Math.ceil(m2 / M2_PER_TABLE);

export const tablesToM2 = (tables: number): number => tables * M2_PER_TABLE;

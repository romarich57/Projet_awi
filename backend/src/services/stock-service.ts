import type { PoolClient } from 'pg';

export async function getReservedTablesByType(
  client: PoolClient,
  festivalId: number
) {
  const { rows } = await client.query(`
    SELECT
      ja.taille_table_requise,
      COALESCE(SUM(ja.nb_tables_occupees), 0) AS total_tables
    FROM jeux_alloues ja
    JOIN reservation r ON r.id = ja.reservation_id
    WHERE r.festival_id = $1
    GROUP BY ja.taille_table_requise
  `, [festivalId]);

  const result = { standard: 0, grande: 0, mairie: 0 };

  for (const row of rows) {
    const key = row.taille_table_requise as keyof typeof result;
    result[key] = Math.round(Number(row.total_tables));
  }

  return result;
}

//la reservation de chaise se fait selon le nombre de table

export async function getReservedChairs(
  client: PoolClient,
  festivalId: number
): Promise<number> {
  const { rows } = await client.query(`
    SELECT COALESCE(SUM(nb_chaises_reservees), 0) AS reserved
    FROM reservation
    WHERE festival_id = $1
  `, [festivalId]);

  return Number(rows[0]?.reserved ?? 0);
}


import { Router } from 'express';
import pool from '../db/database.js';
import {
  getReservedTablesByType,
  getReservedChairs
} from '../services/stock-service.js';

const router = Router();

router.get('/:festivalId', async (req, res) => {
  const festivalId = Number(req.params.festivalId);
  if (!Number.isFinite(festivalId)) {
    return res.status(400).json({ message: 'ID invalide' });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        stock_tables_standard,
        stock_tables_grande,
        stock_tables_mairie,
        stock_chaises
      FROM festival
      WHERE id = $1
    `, [festivalId]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Festival introuvable' });
    }

    const base = rows[0];
    const reservedTables = await getReservedTablesByType(client, festivalId);
    const reservedChairs = await getReservedChairs(client, festivalId);

    res.json({
      tables: [
        {
          type: 'standard',
          total: base.stock_tables_standard,
          reserved: reservedTables.standard,
          available: base.stock_tables_standard - reservedTables.standard,
        },
        {
          type: 'grande',
          total: base.stock_tables_grande,
          reserved: reservedTables.grande,
          available: base.stock_tables_grande - reservedTables.grande,
        },
        {
          type: 'mairie',
          total: base.stock_tables_mairie,
          reserved: reservedTables.mairie,
          available: base.stock_tables_mairie - reservedTables.mairie,
        },
      ],
      chairs: {
        total: base.stock_chaises,
        reserved: reservedChairs,
        available: base.stock_chaises - reservedChairs,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur stock' });
  } finally {
    client.release();
  }
});

export default router;

import { Router } from 'express';
import pool from '../db/database.js';
import {
  getReservedTablesByType,
  getReservedChairs
} from '../services/stock-service.js';

const router = Router();

// stock.ts - version avec logging détaillé
router.get('/:festivalId', async (req, res) => {
  const festivalId = Number(req.params.festivalId);
  console.log(`🔍 [STOCK API] Requête pour festival ID: ${festivalId}`);
  
  if (!Number.isFinite(festivalId)) {
    console.error(`❌ [STOCK API] ID invalide: ${festivalId}`);
    return res.status(400).json({ message: 'ID invalide' });
  }

  const client = await pool.connect();

  try {
    console.log(`📊 [STOCK API] Recherche festival ${festivalId} dans la BD...`);
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
      console.error(`❌ [STOCK API] Festival ${festivalId} non trouvé`);
      return res.status(404).json({ message: 'Festival introuvable' });
    }

    console.log(`✅ [STOCK API] Festival trouvé:`, rows[0]);
    const base = rows[0];
    
    console.log(`📦 [STOCK API] Calcul des tables réservées...`);
    const reservedTables = await getReservedTablesByType(client, festivalId);
    console.log(`📦 [STOCK API] Tables réservées:`, reservedTables);
    
    console.log(`🪑 [STOCK API] Calcul des chaises réservées...`);
    const reservedChairs = await getReservedChairs(client, festivalId);
    console.log(`🪑 [STOCK API] Chaises réservées:`, reservedChairs);

    const response = {
      tables: [
        {
          type: 'standard',
          total: base.stock_tables_standard,
          reserved: reservedTables.standard || 0,
          available: base.stock_tables_standard - (reservedTables.standard || 0),
        },
        {
          type: 'grande',
          total: base.stock_tables_grande,
          reserved: reservedTables.grande || 0,
          available: base.stock_tables_grande - (reservedTables.grande || 0),
        },
        {
          type: 'mairie',
          total: base.stock_tables_mairie,
          reserved: reservedTables.mairie || 0,
          available: base.stock_tables_mairie - (reservedTables.mairie || 0),
        },
      ],
      chairs: {
        total: base.stock_chaises,
        reserved: reservedChairs || 0,
        available: base.stock_chaises - (reservedChairs || 0),
      },
    };
    
    console.log(`✅ [STOCK API] Réponse envoyée:`, response);
    res.json(response);
    
  } catch (err) {
    console.error(`💥 [STOCK API] Erreur:`, err);
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ message: 'Erreur stock', error: errorMessage });
  } finally {
    client.release();
    console.log(`🔗 [STOCK API] Connexion BD libérée`);
  }
});

export default router;

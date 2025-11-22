import pool from './database.js';
export async function ensureFestivals() {
    try {
        const { rows } = await pool.query('SELECT COUNT(*) FROM festival');
        const count = parseInt(rows[0].count);
        if (count === 0) {
            console.log('Aucun festival trouvé, création des festivals par défaut...');
            await pool.query(`
                INSERT INTO festival (name, start_date, end_date, stock_tables_standard, stock_tables_grande, stock_tables_mairie, stock_chaises)
                VALUES 
                    ('Rock en Seine', '2025-08-22', '2025-08-25', 200, 50, 20, 1000),
                    ('Festival de Cannes du Jeu', '2025-02-14', '2025-02-16', 150, 30, 15, 800)
            `);
            console.log('✅ Festivals créés avec succès');
        }
        else {
            console.log(`✅ ${count} festival(s) déjà présent(s) dans la base`);
        }
    }
    catch (error) {
        console.error('Erreur lors de la création des festivals:', error);
    }
}
//# sourceMappingURL=initFestivals.js.map
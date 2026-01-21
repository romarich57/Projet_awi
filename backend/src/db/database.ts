// Role : Initialiser le pool de connexions Postgres.
import pkg from 'pg'
const { Pool } = pkg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL manquant dans les variables d’environnement')
}

const pool = new Pool({
  // Utilise la chaîne fournie par l'environnement de deploiement
  connectionString,
  // Pas de SSL requis : la DB est interne au réseau Docker
})

export default pool

// Role : Initialiser le pool de connexions Postgres.
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  // Utilise la chaîne fournie par docker-compose.prod.yml
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://secureapp:secureapp@localhost:5432/secureapp',
  // Pas de SSL requis : la DB est interne au réseau Docker
})

export default pool

CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY,
 login TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT DEFAULT 'user',
 first_name TEXT,
 last_name TEXT,
 email TEXT UNIQUE NOT NULL,
 phone TEXT,
 avatar_url TEXT,
 email_verified BOOLEAN DEFAULT FALSE,
 email_verification_token TEXT,
 email_verification_expires_at TIMESTAMP,
 password_reset_token TEXT,
 password_reset_expires_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Réinitialiser la séquence pour garantir que le premier utilisateur ait l'id 1
-- Cette opération est idempotente et ne fait rien si des données existent déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    ALTER SEQUENCE users_id_seq RESTART WITH 1;
  END IF;
END $$;

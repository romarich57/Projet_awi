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


-- modification pour qu'on puisse reserve un stock de chaise de maniere independantes des jeux ou tables
ALTER TABLE reservation
ADD COLUMN IF NOT EXISTS nb_chaises_reservees INTEGER NOT NULL DEFAULT 0;

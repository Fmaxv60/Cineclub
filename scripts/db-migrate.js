/* eslint-disable no-console */
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.POSTGRES_DB || !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD) {
  console.error('POSTGRES_DB, POSTGRES_USER et POSTGRES_PASSWORD doivent être définies dans l’environnement');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '100.100.163.122',
  port: Number(process.env.POSTGRES_PORT) || 5433,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: Number(process.env.POSTGRES_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const migrations = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (role IN ('user', 'admin')),
  CHECK (status IN ('pending', 'active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS "Room" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  session_datetime TIMESTAMPTZ NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "RoomMember" (
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES "Room"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (user_id, room_id),
  CHECK (role IN ('member', 'moderator', 'owner'))
);

CREATE TABLE IF NOT EXISTS "Rating" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rating_user_movie_unique UNIQUE (user_id, tmdb_movie_id)
);

CREATE TABLE IF NOT EXISTS "Favorites" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_owner ON "Room"(owner_id);
CREATE INDEX IF NOT EXISTS idx_rating_movie ON "Rating"(tmdb_movie_id);
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Table creation started...');
    await client.query('BEGIN');
    await client.query(migrations);
    await client.query('COMMIT');
    console.log('Table creation completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Table creation failed', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();

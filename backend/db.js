import pg from 'pg';
import './loadEnv.js';
import { createAllowedEmployeesTable, seedAllowedEmployees } from './seedAllowedEmployees.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'game_uat',
  user: process.env.PG_USER || 'postgres',
  password: (process.env.PG_PASSWORD || '').replace(/^"|"$/g, ''),
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS gamethon_players (
      id SERIAL PRIMARY KEY,
      emp_id VARCHAR(50) NOT NULL,
      emp_name VARCHAR(255) NOT NULL,
      session_id BIGINT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'In Progress',
      games_completed INT NOT NULL DEFAULT 0,
      time_taken INT NOT NULL DEFAULT 0,
      breakdown JSONB NOT NULL DEFAULT '{}',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      session_expires_at BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (emp_id, session_id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_gamethon_players_status
    ON gamethon_players (status)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_gamethon_players_started_at
    ON gamethon_players (started_at DESC)
  `);

  await createAllowedEmployeesTable();
  await seedAllowedEmployees();
}

export async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  return result.rows[0];
}

export default pool;

import pg from 'pg';
import '../loadEnv.js';
import { createAllowedEmployeesTable, seedAllowedEmployees } from '../seedAllowedEmployees.js';

const { Client } = pg;

const config = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: (process.env.PG_PASSWORD || '').replace(/^"|"$/g, ''),
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const dbName = process.env.PG_DATABASE || 'game_uat';

async function createDatabase() {
  const admin = new Client({ ...config, database: 'postgres' });
  await admin.connect();

  const exists = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (exists.rows.length) {
    console.log(`Database "${dbName}" already exists.`);
  } else {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  }

  await admin.end();
}

async function initTables() {
  const client = new Client({ ...config, database: dbName });
  await client.connect();

  await client.query(`
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

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_gamethon_players_status
    ON gamethon_players (status)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_gamethon_players_started_at
    ON gamethon_players (started_at DESC)
  `);

  const count = await client.query('SELECT COUNT(*)::int AS count FROM gamethon_players');
  console.log(`Table gamethon_players ready (${count.rows[0].count} rows).`);

  await createAllowedEmployeesTable();
  const seedResult = await seedAllowedEmployees();
  console.log(
    seedResult.seeded
      ? `Table gamethon_allowed_employees seeded (${seedResult.count} employees).`
      : `Table gamethon_allowed_employees ready (${seedResult.count} employees).`
  );

  await client.end();
}

try {
  console.log(`Connecting to ${config.host}:${config.port} as ${config.user}...`);
  await createDatabase();
  await initTables();
  console.log('Setup complete.');
} catch (err) {
  console.error('Setup failed:', err.message);
  process.exit(1);
}

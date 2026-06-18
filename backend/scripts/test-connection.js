import pg from 'pg';
import '../loadEnv.js';

const pwd = (process.env.PG_PASSWORD || '').replace(/^"|"$/g, '');

for (const ssl of [true, false]) {
  const c = new pg.Client({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    user: process.env.PG_USER,
    password: pwd,
    database: 'postgres',
    ssl: ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 8000,
  });
  try {
    await c.connect();
    console.log('Connected with ssl=' + ssl);
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log('Failed ssl=' + ssl + ':', e.message, e.code || '');
  }
}
process.exit(1);

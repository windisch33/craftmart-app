import { Pool } from 'pg';
import { config } from './env';

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('[DATABASE] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DATABASE] Connection error:', err);
});

export default pool;
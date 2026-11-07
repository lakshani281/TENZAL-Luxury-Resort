const { Pool } = require('pg');

/**
 * PostgreSQL Connection Pool Configuration
 * Prepared for node-postgres (pg) connection pooling.
 * Automatically enables SSL for remote hosts (e.g. Supabase) or when DB_SSL=true.
 */
const useSSL =
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.DB_HOST && process.env.DB_HOST.includes('supabase.com'));

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

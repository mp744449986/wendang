import pkg from 'pg';
const { Pool } = pkg;
import config from './index.js';

let pool = null;

const getPool = () => {
  if (!pool && config.database.url) {
    pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

export const query = async (text, params) => {
  const p = getPool();
  if (!p) {
    throw new Error('Database not configured');
  }
  const start = Date.now();
  const result = await p.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
};

export const getClient = async () => {
  const p = getPool();
  if (!p) {
    throw new Error('Database not configured');
  }
  return await p.connect();
};

export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const initDatabase = async () => {
  if (!config.database.url) {
    console.log('No database URL configured');
    return false;
  }
  
  try {
    const p = getPool();
    const result = await p.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

export default {
  query,
  getClient,
  transaction,
  initDatabase,
};

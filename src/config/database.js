import { Pool } from 'pg';
import config from '../config/index.js';

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
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
  try {
    const result = await query('SELECT NOW()');
    console.log('数据库连接成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};

export default {
  query,
  getClient,
  transaction,
  pool,
  initDatabase,
};

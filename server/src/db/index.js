const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined });
module.exports = { pool, query: (text, params) => pool.query(text, params) };

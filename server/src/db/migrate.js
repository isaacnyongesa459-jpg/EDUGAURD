require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('./index');

// All service instances use the same session-level lock so only one can apply migrations at a time.
const LOCK_NAMESPACE = 17012026;
const LOCK_ID = 1;

(async () => {
  const client = await pool.connect();
  let locked = false;
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [LOCK_NAMESPACE, LOCK_ID]);
    locked = true;
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');

    const directory = path.join(__dirname, '../../migrations');
    const migrations = fs.readdirSync(directory).filter(name => name.endsWith('.sql')).sort();
    for (const name of migrations) {
      const seen = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (seen.rowCount) continue;

      await client.query('BEGIN');
      try {
        const sql = fs.readFileSync(path.join(directory, name), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
        console.log(`applied ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    if (locked) {
      try { await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_NAMESPACE, LOCK_ID]); } catch (_) {}
    }
    client.release();
    await pool.end();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});

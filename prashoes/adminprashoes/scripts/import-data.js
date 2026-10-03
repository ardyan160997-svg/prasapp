const fs = require('node:fs');
const { Pool } = require('pg');

const TABLES = [
  'services',
  'promos',
  'member_benefits',
  'gallery',
  'members',
  'pickup_requests',
  'orders',
  'order_items',
  'order_item_photos',
  'cashflow_transactions',
];

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function insertRows(client, table, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  let count = 0;
  for (const row of rows) {
    const keys = Object.keys(row);
    const columns = keys.map(quoteIdent).join(', ');
    const params = keys.map((_, index) => `$${index + 1}`).join(', ');
    const values = keys.map((key) => row[key]);
    await client.query(`INSERT INTO ${quoteIdent(table)} (${columns}) VALUES (${params}) ON CONFLICT DO NOTHING`, values);
    count += 1;
  }
  return count;
}

async function main() {
  const file = process.argv[2] || '/import/adminprashoes-export.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = {};
    for (const table of TABLES) {
      result[table] = await insertRows(client, table, data[table] || []);
    }
    await client.query('COMMIT');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

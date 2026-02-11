
import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  });
  await client.connect();
  
  console.log('Checking recent products...');
  const res = await client.query("SELECT id, title, status, created_at FROM products ORDER BY created_at DESC LIMIT 10");
  
  if (res.rows.length === 0) {
    console.log('No products found in the database.');
  } else {
    console.table(res.rows);
  }
  
  await client.end();
}

main().catch(console.error);

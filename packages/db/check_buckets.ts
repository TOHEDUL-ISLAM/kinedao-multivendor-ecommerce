
import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  });
  await client.connect();
  
  const res = await client.query("SELECT * FROM storage.buckets");
  console.table(res.rows);
  
  await client.end();
}

main().catch(console.error);


import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  });
  await client.connect();
  
  console.log('Creating kinedao-assets bucket...');
  
  // Supabase storage buckets are stored in the storage.buckets table
  try {
    // Check if bucket exists
    const res = await client.query("SELECT id FROM storage.buckets WHERE id = 'kinedao-assets'");
    
    if (res.rows.length === 0) {
      await client.query("INSERT INTO storage.buckets (id, name, public) VALUES ('kinedao-assets', 'kinedao-assets', true)");
      console.log('Bucket kinedao-assets created successfully.');
    } else {
      console.log('Bucket kinedao-assets already exists.');
    }
  } catch (e) {
    console.error('Error creating bucket:', e);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

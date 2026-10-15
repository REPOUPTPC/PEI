import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Connecting to Turso...');
  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Tables found:', res.rows);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


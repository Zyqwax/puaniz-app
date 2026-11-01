import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
process.loadEnvFile('.env.local');
const client = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  const migration = await readFile(new URL('./sql/learning.sql', import.meta.url), 'utf8');
  await client.begin(async tx => { await tx.unsafe(migration); });
  console.log('Gelişim takibi tabloları hazır.');
} finally { await client.end(); }

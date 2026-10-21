import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url =
  process.env.TURSO_DATABASE_URL ||
  'libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIwMzQ0MzksImlkIjoiMDFhMTNkOTMtMzMwMS03YmE2LThkYTktOGI5N2U1MjdmNmMyIiwia2lkIjoidnM2Yl9rSmo5eXJSQkdqMXQ0WWhBUnlWcVg0Tmx6LXp2elhYeHVLQnV6RSIsInJpZCI6IjlmOWYzMDg3LTQyYTQtNDcwZi1hZDIwLTA5YzAxOTNkMmYzYSJ9.R5dpjGTcJyar2YF9WdPudtZMvYk_W31WEoGCG-GRtiIHE_4QbR_T8ekS7z1JOcY500ju-VboYpEH5M8dezRKBg';

const client = createClient({ url, authToken });

export async function seedUniversidades() {
  console.log('🚀 Creando y poblando tabla universidades_venezuela...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS universidades_venezuela (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      siglas TEXT,
      tipo TEXT NOT NULL,
      subtipo TEXT,
      sede_principal TEXT,
      estado TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const sqlPath = path.resolve('sql/universidades_venezuela.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Parse lines starting with ('...')
  const lines = sql.split('\n');
  const inserts = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith('),') || (trimmed.startsWith('(') && trimmed.endsWith(');'))) {
      const clean = trimmed.replace(/^\(/, '').replace(/\)[;,]$/, '');
      const parts = clean.split(',').map(p => p.trim().replace(/^'/, '').replace(/'$/, ''));
      if (parts.length >= 6) {
        inserts.push({
          sql: `INSERT OR REPLACE INTO universidades_venezuela (nombre, siglas, tipo, subtipo, sede_principal, estado) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]],
        });
      }
    }
  }

  console.log(`Poblando ${inserts.length} universidades...`);
  for (let i = 0; i < inserts.length; i += 20) {
    const batch = inserts.slice(i, i + 20);
    await client.batch(batch);
  }

  const countRes = await client.execute('SELECT COUNT(*) as c FROM universidades_venezuela;');
  console.log(`✅ Total universidades en BD: ${countRes.rows[0]?.c}`);
}

seedUniversidades().catch(err => {
  console.error('Error al poblar universidades:', err);
});

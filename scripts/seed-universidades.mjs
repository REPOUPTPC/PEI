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
  console.log('🚀 Creando y actualizando tabla universidades_venezuela con catálogo OPSU...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS universidades_venezuela (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      siglas TEXT,
      codigo TEXT,
      tipo TEXT NOT NULL,
      subtipo TEXT,
      sede_principal TEXT,
      estado TEXT,
      logo_url TEXT,
      fachada_url TEXT,
      fuente_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const colsToAdd = [
    'ALTER TABLE universidades_venezuela ADD COLUMN codigo TEXT;',
    'ALTER TABLE universidades_venezuela ADD COLUMN logo_url TEXT;',
    'ALTER TABLE universidades_venezuela ADD COLUMN fachada_url TEXT;',
    'ALTER TABLE universidades_venezuela ADD COLUMN fuente_url TEXT;',
  ];
  for (const alterSql of colsToAdd) {
    try {
      await client.execute(alterSql);
    } catch {}
  }

  const sqlPath = path.resolve('sql/universidades_venezuela.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Parse lines starting with ('...')
  const lines = sql.split('\n');
  const inserts = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('(') && (trimmed.endsWith('),') || trimmed.endsWith(');'))) {
      const clean = trimmed.replace(/^\(/, '').replace(/\)[;,]$/, '');
      // Match sql tokens: NULL or '...'
      const tokens = clean.match(/(NULL|'(?:''|[^'])*')/g);
      if (tokens && tokens.length >= 10) {
        const parts = tokens.map(t => {
          if (t === 'NULL') return null;
          return t.slice(1, -1).replace(/''/g, "'");
        });
        inserts.push({
          sql: `INSERT OR REPLACE INTO universidades_venezuela (nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            parts[0],
            parts[1],
            parts[2],
            parts[3],
            parts[4],
            parts[5],
            parts[6],
            parts[7],
            parts[8],
            parts[9],
          ],
        });
      }
    }
  }

  console.log(`Poblando catálogo integrado de ${inserts.length} instituciones...`);
  for (let i = 0; i < inserts.length; i += 20) {
    const batch = inserts.slice(i, i + 20);
    await client.batch(batch);
  }

  const countRes = await client.execute('SELECT COUNT(*) as c FROM universidades_venezuela;');
  console.log(`✅ Total universidades e IEU en BD: ${countRes.rows[0]?.c}`);
}

seedUniversidades().catch(err => {
  console.error('Error al poblar universidades:', err);
});

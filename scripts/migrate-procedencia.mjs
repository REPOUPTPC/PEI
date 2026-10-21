import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url =
  process.env.TURSO_DATABASE_URL ||
  'libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIwMzQ0MzksImlkIjoiMDFhMTNkOTMtMzMwMS03YmE2LThkYTktOGI5N2U1MjdmNmMyIiwia2lkIjoidnM2Yl9rSmo5eXJSQkdqMXQ0WWhBUnlWcVg0Tmx6LXp2elhYeHVLQnV6RSIsInJpZCI6IjlmOWYzMDg3LTQyYTQtNDcwZi1hZDIwLTA5YzAxOTNkMmYzYSJ9.R5dpjGTcJyar2YF9WdPudtZMvYk_W31WEoGCG-GRtiIHE_4QbR_T8ekS7z1JOcY500ju-VboYpEH5M8dezRKBg';

const client = createClient({ url, authToken });

async function migrateProcedencia() {
  console.log('🚀 Iniciando migración de columnas de Procedencia en Turso...');

  const colsToAdd = [
    { name: 'id_estado_procedencia', type: 'INTEGER DEFAULT NULL' },
    { name: 'estado_procedencia_nombre', type: 'TEXT DEFAULT NULL' },
    { name: 'id_municipio_procedencia', type: 'INTEGER DEFAULT NULL' },
    { name: 'municipio_procedencia_nombre', type: 'TEXT DEFAULT NULL' },
    { name: 'id_parroquia_procedencia', type: 'INTEGER DEFAULT NULL' },
    { name: 'parroquia_procedencia_nombre', type: 'TEXT DEFAULT NULL' },
  ];

  const tableInfo = await client.execute('PRAGMA table_info(docentes);');
  const existingCols = new Set(tableInfo.rows.map(r => r.name));

  for (const col of colsToAdd) {
    if (!existingCols.has(col.name)) {
      console.log(`➕ Añadiendo columna "${col.name}" a docentes...`);
      try {
        await client.execute(`ALTER TABLE docentes ADD COLUMN ${col.name} ${col.type};`);
        console.log(`✅ Columna "${col.name}" añadida.`);
      } catch (err) {
        console.error(`❌ Error añadiendo columna ${col.name}:`, err.message);
      }
    } else {
      console.log(`ℹ️ Columna "${col.name}" ya existe.`);
    }
  }

  console.log('🎉 Migración de procedencia completada con éxito.');
}

migrateProcedencia().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});

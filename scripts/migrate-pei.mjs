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

async function migrate() {
  console.log('🚀 Iniciando migración de base de datos en Turso...');

  // 1. Columnas a añadir a la tabla docentes si no existen
  const colsToAdd = [
    { name: 'publicaciones_repositorio', type: 'INTEGER DEFAULT 0' },
    { name: 'areas_interes_investigativo', type: 'TEXT' },
    { name: 'participado_ponente', type: 'INTEGER DEFAULT 0' },
    { name: 'participado_participante', type: 'INTEGER DEFAULT 0' },
    { name: 'eventos_detalle', type: 'TEXT' },
    { name: 'desarrollo_academico_actual', type: 'INTEGER DEFAULT 0' },
    { name: 'desarrollo_academico_detalle', type: 'TEXT' },
    { name: 'tutoria_proyectos_activa', type: 'INTEGER DEFAULT 0' },
    { name: 'tutorias_detalle', type: 'TEXT' },
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
        console.error(`Error añadiendo columna ${col.name}:`, err.message);
      }
    } else {
      console.log(`ℹ️ Columna "${col.name}" ya existe.`);
    }
  }

  // 2. Crear tabla areas_interes_investigativo
  console.log('2️⃣ Verificando tabla areas_interes_investigativo...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS areas_interes_investigativo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      nivel INTEGER NOT NULL DEFAULT 4,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const areasCount = await client.execute('SELECT COUNT(*) as c FROM areas_interes_investigativo;');
  const currentCount = Number(areasCount.rows[0]?.c || 0);
  console.log(`📊 Áreas actuales en BD: ${currentCount}`);

  if (currentCount === 0) {
    console.log('🌱 Poblando áreas desde sql/Areas_interes_investigativo.sql...');
    const sqlPath = path.resolve('sql/Areas_interes_investigativo.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      const lines = sqlContent.split('\n');
      let currentInsertType = null;
      const statements = [];

      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('--') || !line) continue;

        if (line.includes('INSERT INTO areas_interes_investigativo (id, nombre, parent_id, nivel) VALUES')) {
          currentInsertType = 'WITH_ID';
          continue;
        } else if (line.includes('INSERT INTO areas_interes_investigativo (nombre, parent_id, nivel) VALUES')) {
          currentInsertType = 'NO_ID';
          continue;
        }

        if (currentInsertType && line.startsWith('(')) {
          const cleanLine = line.replace(/,\s*$/, '').replace(/;\s*$/, '');
          const match = cleanLine.match(/^\((.+)\)$/);
          if (match) {
            const rawParts = match[1].split(',').map(s => s.trim());
            if (currentInsertType === 'WITH_ID') {
              const id = parseInt(rawParts[0]);
              const nombre = rawParts[1].replace(/^'/, '').replace(/'$/, '');
              const parent_id = rawParts[2].toUpperCase() === 'NULL' ? null : parseInt(rawParts[2]);
              const nivel = parseInt(rawParts[3]);
              statements.push({
                sql: 'INSERT OR REPLACE INTO areas_interes_investigativo (id, nombre, parent_id, nivel) VALUES (?, ?, ?, ?)',
                args: [id, nombre, parent_id, nivel],
              });
            } else if (currentInsertType === 'NO_ID') {
              const nombre = rawParts[0].replace(/^'/, '').replace(/'$/, '');
              const parent_id = rawParts[1].toUpperCase() === 'NULL' ? null : parseInt(rawParts[1]);
              const nivel = parseInt(rawParts[2]);
              statements.push({
                sql: 'INSERT INTO areas_interes_investigativo (nombre, parent_id, nivel) VALUES (?, ?, ?)',
                args: [nombre, parent_id, nivel],
              });
            }
          }
        }
      }

      console.log(`Ejecutando ${statements.length} inserciones de áreas de investigación...`);
      for (let i = 0; i < statements.length; i += 25) {
        const batch = statements.slice(i, i + 25);
        await client.batch(batch);
      }
      console.log('✅ Áreas de interés investigativo pobladas exitosamente.');
    }
  }

  // 3. Configuración observatorio_publico por defecto si no existe
  const obsConfig = await client.execute("SELECT valor FROM configuracion WHERE clave = 'observatorio_publico';");
  if (obsConfig.rows.length === 0) {
    console.log('3️⃣ Configurando observatorio_publico = false por defecto...');
    await client.execute({
      sql: 'INSERT INTO configuracion (clave, valor) VALUES (?, ?)',
      args: ['observatorio_publico', 'false'],
    });
  } else {
    console.log(`ℹ️ observatorio_publico actual: ${obsConfig.rows[0].valor}`);
  }

  console.log('🎉 Migración completada con éxito.');
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});

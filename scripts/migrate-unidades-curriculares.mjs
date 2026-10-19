import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Canonical mapping and corrections
const manualCorrections = {
  'MANEJO DE LAS TIC\\': 'MANEJO DE LAS TIC',
  'DEPORTE, ARTE, CULTURA Y RECREACIÓN  II': 'DEPORTE, ARTE, CULTURA Y RECREACIÓN II',
  'DEPORTE ARTE CULTURA Y RECREACIÓN': 'DEPORTE, ARTE, CULTURA Y RECREACIÓN I',
  'DEPORTE(REQUISITO DE EGRESO)': 'DEPORTE (REQUISITO DE EGRESO)',
  'ANÁLISIS MATEMÁTICOIII': 'ANÁLISIS MATEMÁTICO III',
  'PRINCIPIOS DE TREMODINÁMICA': 'PRINCIPIOS DE TERMODINÁMICA',
  'TRASNFERENCIA DE CALOR': 'TRANSFERENCIA DE CALOR',
  'FINANZAS PUBLICAS MUNICIPALES PRESUPUIESTO': 'FINANZAS PÚBLICAS MUNICIPALES Y PRESUPUESTO',
  'INTRODUCCIÒN AL PNF': 'INTRODUCCIÓN AL PNF',
  'INTRODUCCIÒN A LOS PST': 'INTRODUCCIÓN A LOS PST',
  'MATERIALES COMPUESTOS Y AVANZADO': 'MATERIALES COMPUESTOS Y AVANZADOS',
  'DESARROLLO DE LAS HABILIDADES Y PENS': 'DESARROLLO DE LAS HABILIDADES DEL PENSAMIENTO',
  'MECÁNICA APLICADA  II': 'MECÁNICA APLICADA II',
  'ELECTIVA  1': 'ELECTIVA 1',
  'ELECTIVA  2': 'ELECTIVA 2',
  'IDIOMAS(INGLES)': 'IDIOMAS (INGLÉS)',
  'IDIOMAS(INGLÉS)': 'IDIOMAS (INGLÉS)',
  'AUDITORÍA INFORMATÍCA': 'AUDITORÍA INFORMÁTICA',
  'SEGURIDAD INFORMATÍCA': 'SEGURIDAD INFORMÁTICA',
  'GESTIÓN TECNOLOGÍCA': 'GESTIÓN TECNOLÓGICA',
  'QUIMÍCA APLICADA': 'QUÍMICA APLICADA',
  'PROYECTO SOCIO TECNOLOGÍCO I': 'PROYECTO SOCIO TECNOLÓGICO I',
  'PROYECTO SOCIO TECNOLOGICO I': 'PROYECTO SOCIO TECNOLÓGICO I',
  'PROYECTO SOCIO TECNOLOGÍCO II': 'PROYECTO SOCIO TECNOLÓGICO II',
  'FORMACIÓN SOCIO CRI TICA I': 'FORMACIÓN SOCIO CRÍTICA I',
  'MATEMA TICA FINANCIERA': 'MATEMÁTICA FINANCIERA',
  'MATEMATICA FINANCIERA': 'MATEMÁTICA FINANCIERA',
  'MATEMATICA': 'MATEMÁTICA',
  'MATEMATICA I': 'MATEMÁTICA I',
  'MATEMATICA II': 'MATEMÁTICA II',
  'ESTADISTICA': 'ESTADÍSTICA',
  'INGLES': 'INGLÉS',
  'INGLES (ACTIVIDAD ACREDITABLE)': 'INGLÉS (ACTIVIDAD ACREDITABLE)',
  'INGLES I (ACTIVIDAD ACREDITABLE)': 'INGLÉS I (ACTIVIDAD ACREDITABLE)',
  'INGLES II (ACTIVIDAD ACREDITABLE)': 'INGLÉS II (ACTIVIDAD ACREDITABLE)',
  'INGLES III (ACTIVIDAD ACREDITABLE)': 'INGLÉS III (ACTIVIDAD ACREDITABLE)',
  'FUNDAMENTOS DE ADMINISTRACION': 'FUNDAMENTOS DE ADMINISTRACIÓN',
  'LEGISLACION ADUANERA': 'LEGISLACIÓN ADUANERA',
  'SISTEMAS DE INFORMACION': 'SISTEMAS DE INFORMACIÓN',
  'VALORACION ADUANERA': 'VALORACIÓN ADUANERA',
  'MAQUINAS HIDRAULICAS': 'MÁQUINAS HIDRÁULICAS',
  'MAQUINAS Y HERRAMIENTAS': 'MÁQUINAS Y HERRAMIENTAS',
  'PRACTICAS PROFESIONALES': 'PRÁCTICAS PROFESIONALES',
  'PROGRAMACION II': 'PROGRAMACIÓN II',
  'ALGORITMICA Y PROGRAMACION I': 'ALGORÍTMICA Y PROGRAMACIÓN I',
  'FORMACION CRÍTICA I': 'FORMACIÓN CRÍTICA I',
  'FORMACIÓN CRITICA II': 'FORMACIÓN CRÍTICA II',
  'FORMACIÓN SOCIO CRITICA I': 'FORMACIÓN SOCIO CRÍTICA I',
  'FORMACIÓN SOCIO CRITICA II': 'FORMACIÓN SOCIO CRÍTICA II',
  'RAZONAMIENTO NUMERICO': 'RAZONAMIENTO NUMÉRICO',
  'PASANTIA MECANICA TERMICA': 'PASANTÍA MECÁNICA TÉRMICA',
  'PROCESOS METALURGICOS': 'PROCESOS METALÚRGICOS',
  'PROYECTO DE GRADO MECANICA TERMICA': 'PROYECTO DE GRADO MECÁNICA TÉRMICA',
  'ELECTROTECNIA': 'ELECTROTECNIA',
  'ELECTROTECNÍA': 'ELECTROTECNIA',
  'TECNOLOGÍA DE ANALISIS DE FALLAS': 'TECNOLOGÍA DE ANÁLISIS DE FALLAS',
  'RESISTENCIA MATERIALES': 'RESISTENCIA DE MATERIALES',
  'TECNOLOGÍA DE LOS MATERIALES': 'TECNOLOGÍA DE MATERIALES',
  'CIENCIA, TECNOLOGÍA Y SOCIEDAD': 'CIENCIA, TECNOLOGÍA Y SOCIEDAD',
  'AUTOMATIZACIÓN DE LA GESTIÓN ADMINISTRATIVOS DEL MANTENIMIENTO': 'AUTOMATIZACIÓN DE LA GESTIÓN ADMINISTRATIVA DEL MANTENIMIENTO',
  'INTRODUCCIÓN A LOS PROYECTOS Y AL PROGRAMA NACIONAL DE FORMACIÓN': 'INTRODUCCIÓN A LOS PROYECTOS Y AL PNF',
};

function normalizeString(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function run() {
  console.log('🚀 Procesando lista de Unidades Curriculares...');

  const csvPath = 'scripts/lista_unidades_curriculares.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

  console.log(`Filas originales en CSV: ${parsed.data.length}`);

  const uniqueMap = new Map();

  for (const row of parsed.data) {
    let rawName = row.Nombre_Unidad_Curricular;
    if (!rawName || rawName.trim().toUpperCase() === 'NULL') continue;

    let cleanName = rawName.trim().replace(/\\+$/, '').trim().replace(/^["']|["']$/g, '').trim().replace(/\s+/g, ' ');
    if (manualCorrections[cleanName]) {
      cleanName = manualCorrections[cleanName];
    }

    const norm = normalizeString(cleanName);
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, {
        nombre: cleanName,
        codigo: row.Codigo && row.Codigo !== 'NULL' ? row.Codigo : '',
        pensum: row.Pensum && row.Pensum !== 'NULL' ? row.Pensum : '',
      });
    }
  }

  const cleanList = Array.from(uniqueMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  console.log(`✅ Total Unidades Curriculares únicas y limpias: ${cleanList.length}`);

  // 1. Guardar CSV limpio con cabecera estándar
  const csvOutput = Papa.unparse(
    cleanList.map((item, idx) => ({
      N: idx + 1,
      Nombre_Unidad_Curricular: item.nombre,
      Codigo_Referencia: item.codigo,
      Pensum_Referencia: item.pensum,
    }))
  );

  fs.writeFileSync('public/unidades_curriculares_limpias.csv', csvOutput, 'utf8');
  fs.writeFileSync('scripts/unidades_curriculares_limpias.csv', csvOutput, 'utf8');
  console.log('📁 Archivo CSV limpio guardado en public/unidades_curriculares_limpias.csv');

  // 2. Crear tabla unidades_curriculares en Turso
  console.log('📦 Creando tabla unidades_curriculares en Turso...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS unidades_curriculares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      codigo TEXT,
      pensum TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 3. Insertar las unidades curriculares limpias
  console.log('📥 Insertando unidades curriculares en Turso...');
  const stmts = cleanList.map(item => ({
    sql: `INSERT OR IGNORE INTO unidades_curriculares (nombre, codigo, pensum) VALUES (?, ?, ?);`,
    args: [item.nombre, item.codigo, item.pensum],
  }));

  for (let i = 0; i < stmts.length; i += 50) {
    const chunk = stmts.slice(i, i + 50);
    await client.batch(chunk);
  }
  console.log(`✅ ${cleanList.length} Unidades Curriculares insertadas o verificadas.`);

  // 4. Agregar columnas a docentes si no existen
  console.log('🛠️ Verificando columnas en tabla docentes...');
  const tableInfo = await client.execute('PRAGMA table_info(docentes);');
  const existingCols = new Set(tableInfo.rows.map(r => r.name));

  const newCols = [
    { name: 'asignaturas_imparte', type: "TEXT DEFAULT '[]'" },
    { name: 'conoce_lineas_pnf', type: 'INTEGER DEFAULT 0' },
    { name: 'lineas_pnf_detalle', type: "TEXT DEFAULT ''" },
  ];

  for (const col of newCols) {
    if (!existingCols.has(col.name)) {
      console.log(`➕ Añadiendo columna "${col.name}" a docentes...`);
      await client.execute(`ALTER TABLE docentes ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Columna "${col.name}" añadida.`);
    } else {
      console.log(`ℹ️ Columna "${col.name}" ya existe.`);
    }
  }

  // 5. Verificar conteo final
  const countRes = await client.execute('SELECT COUNT(*) as total FROM unidades_curriculares;');
  console.log(`🎉 Total de unidades curriculares en base de datos: ${countRes.rows[0]?.total}`);
}

run().catch(err => {
  console.error('❌ Error durante la migración:', err);
  process.exit(1);
});

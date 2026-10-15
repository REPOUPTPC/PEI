import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function batchExecute(statements, batchSize = 50) {
  for (let i = 0; i < statements.length; i += batchSize) {
    const chunk = statements.slice(i, i + batchSize);
    await client.batch(chunk);
  }
}

async function initDatabase() {
  console.log('🚀 Inicializando Base de Datos en Turso...');

  // 1. Crear tablas del sistema
  console.log('1️⃣ Creando tablas estructurales...');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre_completo TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('SUPERADMIN', 'ADMIN', 'ENCUESTADOR')),
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS pnfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'PNF'
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS carreras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'INGENIERIA',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS estados (
      id_estado INTEGER PRIMARY KEY,
      estado TEXT NOT NULL,
      iso_3166_2 TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS municipios (
      id_municipio INTEGER PRIMARY KEY,
      id_estado INTEGER NOT NULL,
      municipio TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS parroquias (
      id_parroquia INTEGER PRIMARY KEY,
      id_municipio INTEGER NOT NULL,
      parroquia TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ciudades (
      id_ciudad INTEGER PRIMARY KEY,
      id_estado INTEGER NOT NULL,
      ciudad TEXT NOT NULL,
      capital INTEGER DEFAULT 0
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS docentes (
      cedula TEXT PRIMARY KEY,
      nombres TEXT,
      apellidos TEXT,
      nombre_completo TEXT NOT NULL,
      fecha_nacimiento TEXT,
      genero TEXT,
      email TEXT,
      telefono TEXT,
      foto_url TEXT,
      cargo TEXT,
      desde TEXT,
      status TEXT DEFAULT 'ACTIVO',
      
      id_estado INTEGER,
      estado_nombre TEXT,
      id_municipio INTEGER,
      municipio_nombre TEXT,
      id_parroquia INTEGER,
      parroquia_nombre TEXT,
      direccion TEXT,
      
      tipo_profesion TEXT,
      carrera_pregrado TEXT,
      rama_especifica TEXT,
      universidad_pregrado TEXT,
      anio_pregrado INTEGER,
      titulos_adicionales TEXT,
      
      posee_especialidad INTEGER DEFAULT 0,
      especialidades TEXT,
      posee_maestria INTEGER DEFAULT 0,
      maestrias TEXT,
      posee_doctorado INTEGER DEFAULT 0,
      doctorados TEXT,
      
      componente_docente INTEGER DEFAULT 0,
      usuario_recitven INTEGER DEFAULT 0,
      colegiado INTEGER DEFAULT 0,
      nombre_colegio TEXT,
      numero_colegio TEXT,
      
      pnfs TEXT,
      
      linea_investigacion TEXT,
      investigacion_en_desarrollo INTEGER DEFAULT 0,
      investigacion_instituto TEXT,
      investigacion_titulo TEXT,
      investigacion_linea TEXT,
      
      publicaciones_libros INTEGER DEFAULT 0,
      libros_detalle TEXT,
      publicaciones_articulos INTEGER DEFAULT 0,
      articulos_detalle TEXT,
      
      posee_diplomados INTEGER DEFAULT 0,
      diplomados_detalle TEXT,
      potencialidades TEXT,
      observaciones TEXT,
      
      encuestado INTEGER DEFAULT 0,
      registrado_por TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 2. Insertar SuperAdmin inicial
  console.log('2️⃣ Configurando SUPERADMIN y permisos...');
  await client.execute({
    sql: `INSERT OR REPLACE INTO usuarios (username, password, nombre_completo, rol, activo) 
          VALUES ('CIENCIA_TECNOLOGIA', 'CYT_01012023', 'Unidad de Ciencia y Tecnología (SUPERADMIN)', 'SUPERADMIN', 1)`,
    args: [],
  });

  const permisosAdminDefault = JSON.stringify({
    observatorio: true,
    docentes: true,
    encuesta: true,
    reportes: true,
    carga_masiva: true,
    configuracion: false,
    usuarios: false,
  });

  await client.execute({
    sql: `INSERT OR REPLACE INTO configuracion (clave, valor) VALUES ('admin_permisos', ?)`,
    args: [permisosAdminDefault],
  });

  // 3. Insertar PNFs solicitados
  console.log('3️⃣ Insertando PNFs...');
  const pnfs = [
    { codigo: 'PT-MT', nombre: 'PT en Mecánica Térmica', tipo: 'PT' },
    { codigo: 'PT-MA', nombre: 'PT en Mecánica Automotriz', tipo: 'PT' },
    { codigo: 'PNF-MI', nombre: 'PNF en Materiales Industriales', tipo: 'PNF' },
    { codigo: 'PNF-MAN', nombre: 'PNF en Mantenimiento', tipo: 'PNF' },
    { codigo: 'PNF-MEC', nombre: 'PNF en Mecánica', tipo: 'PNF' },
    { codigo: 'PNF-TUR', nombre: 'PNF en Turismo', tipo: 'PNF' },
    { codigo: 'PNF-INF', nombre: 'PNF en Informática', tipo: 'PNF' },
    { codigo: 'PNF-DL', nombre: 'PNF en Distribución y Logística', tipo: 'PNF' },
  ];

  const pnfStmts = pnfs.map(pnf => ({
    sql: `INSERT OR IGNORE INTO pnfs (codigo, nombre, tipo) VALUES (?, ?, ?)`,
    args: [pnf.codigo, pnf.nombre, pnf.tipo],
  }));
  await batchExecute(pnfStmts);

  // 4. Insertar Carreras base iniciales
  console.log('4️⃣ Insertando carreras base...');
  const carrerasBase = [
    { nombre: 'Ingeniería Mecánica', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería en Informática', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería en Mantenimiento', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería Industrial', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería Eléctrica', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería Electrónica', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería Química', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería Civil', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería de Sistemas', tipo: 'INGENIERO' },
    { nombre: 'Ingeniería en Materiales', tipo: 'INGENIERO' },
    { nombre: 'Licenciatura en Educación', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Administración', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Contaduría Pública', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Turismo', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Informática', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Química', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Física', tipo: 'LICENCIADO' },
    { nombre: 'Licenciatura en Matemáticas', tipo: 'LICENCIADO' },
    { nombre: 'Medicina General', tipo: 'MEDICO' },
    { nombre: 'Medicina Ocupacional', tipo: 'MEDICO' },
    { nombre: 'Abogado', tipo: 'ABOGADO' },
    { nombre: 'Arquitectura', tipo: 'ARQUITECTO' },
    { nombre: 'TSU en Mecánica', tipo: 'TSU' },
    { nombre: 'TSU en Informática', tipo: 'TSU' },
    { nombre: 'TSU en Mantenimiento', tipo: 'TSU' },
    { nombre: 'TSU en Turismo', tipo: 'TSU' },
  ];

  const carreraStmts = carrerasBase.map(c => ({
    sql: `INSERT OR IGNORE INTO carreras (nombre, tipo) VALUES (?, ?)`,
    args: [c.nombre, c.tipo],
  }));
  await batchExecute(carreraStmts);

  // 5. Poblar Geografía de Venezuela desde sql/venezuela.sql si existe
  const venPath = path.resolve('sql/venezuela.sql');
  if (fs.existsSync(venPath)) {
    console.log('5️⃣ Procesando sql/venezuela.sql con batching acelerado...');
    const venContent = fs.readFileSync(venPath, 'utf8');

    // Parse estados
    const estadosMatch = venContent.match(/INSERT INTO `estados`[^;]+;/);
    if (estadosMatch) {
      const tuples = parseTuples(estadosMatch[0]);
      console.log(`Cargando ${tuples.length} estados...`);
      const stmts = tuples.map(t => ({
        sql: `INSERT OR REPLACE INTO estados (id_estado, estado, iso_3166_2) VALUES (?, ?, ?)`,
        args: [parseInt(t[0]), t[1], t[2]],
      }));
      await batchExecute(stmts, 50);
    }

    // Parse municipios
    const munMatch = venContent.match(/INSERT INTO `municipios`[^;]+;/);
    if (munMatch) {
      const tuples = parseTuples(munMatch[0]);
      console.log(`Cargando ${tuples.length} municipios...`);
      const stmts = tuples.map(t => ({
        sql: `INSERT OR REPLACE INTO municipios (id_municipio, id_estado, municipio) VALUES (?, ?, ?)`,
        args: [parseInt(t[0]), parseInt(t[1]), t[2]],
      }));
      await batchExecute(stmts, 50);
    }

    // Parse parroquias
    const parMatch = venContent.match(/INSERT INTO `parroquias`[^;]+;/);
    if (parMatch) {
      const tuples = parseTuples(parMatch[0]);
      console.log(`Cargando ${tuples.length} parroquias...`);
      const stmts = tuples.map(t => ({
        sql: `INSERT OR REPLACE INTO parroquias (id_parroquia, id_municipio, parroquia) VALUES (?, ?, ?)`,
        args: [parseInt(t[0]), parseInt(t[1]), t[2]],
      }));
      await batchExecute(stmts, 50);
    }

    // Parse ciudades
    const ciuMatch = venContent.match(/INSERT INTO `ciudades`[^;]+;/);
    if (ciuMatch) {
      const tuples = parseTuples(ciuMatch[0]);
      console.log(`Cargando ${tuples.length} ciudades...`);
      const stmts = tuples.map(t => ({
        sql: `INSERT OR REPLACE INTO ciudades (id_ciudad, id_estado, ciudad, capital) VALUES (?, ?, ?, ?)`,
        args: [parseInt(t[0]), parseInt(t[1]), t[2], parseInt(t[3] || 0)],
      }));
      await batchExecute(stmts, 50);
    }
  }

  // 6. Poblar Docentes Activos desde sql/docentes_activos.sql
  const docPath = path.resolve('sql/docentes_activos.sql');
  if (fs.existsSync(docPath)) {
    console.log('6️⃣ Procesando sql/docentes_activos.sql...');
    const docContent = fs.readFileSync(docPath, 'utf8');
    const docMatch = docContent.match(/INSERT INTO docentes_activos[^;]+;/);
    if (docMatch) {
      const tuples = parseTuples(docMatch[0]);
      console.log(`Cargando ${tuples.length} docentes activos iniciales...`);
      const stmts = tuples.map(t => {
        const cedula = t[0];
        const nombre_completo = t[1];
        const cargo = t[2];
        const desde = t[3];

        const partes = nombre_completo.trim().split(/\s+/);
        let apellidos = '';
        let nombres = '';
        if (partes.length >= 4) {
          apellidos = `${partes[0]} ${partes[1]}`;
          nombres = partes.slice(2).join(' ');
        } else if (partes.length === 3) {
          apellidos = `${partes[0]} ${partes[1]}`;
          nombres = partes[2];
        } else if (partes.length === 2) {
          apellidos = partes[0];
          nombres = partes[1];
        } else {
          nombres = nombre_completo;
        }

        // Asignación de muestra representativa para enriquecer el observatorio inicial si no está censado aún
        return {
          sql: `INSERT OR IGNORE INTO docentes 
                (cedula, nombre_completo, nombres, apellidos, cargo, desde, status, encuestado) 
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO', 0)`,
          args: [cedula, nombre_completo, nombres, apellidos, cargo, desde],
        };
      });
      await batchExecute(stmts, 50);
    }
  }

  console.log('✅ Base de datos Turso inicializada y sincronizada con éxito!');
}

function parseTuples(insertSql) {
  const valuesIdx = insertSql.toUpperCase().indexOf('VALUES');
  if (valuesIdx === -1) return [];
  const body = insertSql.substring(valuesIdx + 6).trim().replace(/;$/, '');
  
  const results = [];
  let inString = false;
  let escape = false;
  let currentTuple = [];
  let currentValue = '';
  let insideTuple = false;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (escape) {
      currentValue += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === "'" || char === "`") {
      inString = !inString;
      continue;
    }
    if (inString) {
      currentValue += char;
      continue;
    }
    if (char === '(') {
      insideTuple = true;
      currentTuple = [];
      currentValue = '';
      continue;
    }
    if (char === ')') {
      if (insideTuple) {
        currentTuple.push(currentValue.trim());
        results.push(currentTuple);
        currentTuple = [];
        currentValue = '';
        insideTuple = false;
      }
      continue;
    }
    if (char === ',' && insideTuple) {
      currentTuple.push(currentValue.trim());
      currentValue = '';
      continue;
    }
    if (insideTuple) {
      currentValue += char;
    }
  }

  return results;
}

initDatabase().catch(err => {
  console.error('❌ Error inicializando DB:', err);
  process.exit(1);
});

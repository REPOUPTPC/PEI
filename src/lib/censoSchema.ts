import type { Client } from '@libsql/client';
import { calcularCompletitud } from './censo';

/**
 * Columnas agregadas para:
 * - Control de completitud del censo (umbral > 90%).
 * - Trayectoria directiva y cargos (UPTPC, externos y políticos).
 * Se agregan de forma no destructiva (ALTER TABLE ADD COLUMN) e idempotente.
 */
const NUEVAS_COLUMNAS: { name: string; type: string }[] = [
  { name: 'porcentaje_completitud', type: 'REAL DEFAULT NULL' },
  { name: 'censo_iniciado', type: 'INTEGER DEFAULT 0' },
  { name: 'fue_director_uptpc', type: 'INTEGER DEFAULT 0' },
  { name: 'director_uptpc_unidades', type: 'TEXT DEFAULT NULL' },
  { name: 'fue_director_externo', type: 'INTEGER DEFAULT 0' },
  { name: 'director_externo_detalle', type: 'TEXT DEFAULT NULL' },
  { name: 'cargo_directivo_uptpc_actual', type: 'INTEGER DEFAULT 0' },
  { name: 'cargos_directivos_uptpc', type: 'TEXT DEFAULT NULL' },
  { name: 'cargo_directivo_externo_actual', type: 'INTEGER DEFAULT 0' },
  { name: 'cargo_directivo_externo_detalle', type: 'TEXT DEFAULT NULL' },
  { name: 'cargo_politico_actual', type: 'INTEGER DEFAULT 0' },
  { name: 'cargo_politico_detalle', type: 'TEXT DEFAULT NULL' },
  { name: 'cargo_politico_desde', type: 'TEXT DEFAULT NULL' },
];

let schemaPromise: Promise<void> | null = null;

async function runEnsure(db: Client) {
  // 1. Columnas existentes
  const info = await db.execute('PRAGMA table_info(docentes)');
  const existentes = new Set(info.rows.map(r => String(r.name)));

  for (const col of NUEVAS_COLUMNAS) {
    if (!existentes.has(col.name)) {
      try {
        await db.execute(`ALTER TABLE docentes ADD COLUMN ${col.name} ${col.type};`);
      } catch {
        // Ignorar si ya existe (condición de carrera entre instancias)
      }
    }
  }

  // 2. Recalcular planillas previamente guardadas que aún no tienen porcentaje calculado.
  //    Antes, cualquier guardado marcaba encuestado = 1 aunque la planilla estuviera incompleta.
  const pendientes = await db.execute(
    'SELECT * FROM docentes WHERE porcentaje_completitud IS NULL AND (encuestado = 1 OR censo_iniciado = 1)'
  );

  if (pendientes.rows.length > 0) {
    const stmts = pendientes.rows.map(row => {
      const r = calcularCompletitud(row as any);
      return {
        sql: 'UPDATE docentes SET porcentaje_completitud = ?, censo_iniciado = 1, encuestado = ? WHERE cedula = ?',
        args: [r.porcentaje, r.completo ? 1 : 0, row.cedula as string],
      };
    });
    // Lotes para no sobrecargar la conexión
    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100), 'write');
    }
  }
}

/** Garantiza el esquema del censo (una vez por instancia del servidor). */
export function ensureCensoSchema(db: Client): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runEnsure(db).catch(err => {
      console.error('Error asegurando esquema del censo:', err);
      schemaPromise = null; // reintentar en la próxima petición
    });
  }
  return schemaPromise;
}

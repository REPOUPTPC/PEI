import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows, registrado_por } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No se recibieron filas válidas para importar' });
    }

    const stmts: any[] = [];
    let processed = 0;

    for (const row of rows) {
      // Row can be array or object
      // Expected typical format: [cedula, nombre_completo, cargo, desde, profesion, carrera, pnf, email, telefono]
      let cedula = '';
      let nombre_completo = '';
      let cargo = 'DOCENTE';
      let desde = '';
      let tipo_profesion: string | null = null;
      let carrera_pregrado: string | null = null;
      let pnfs: string | null = null;
      let email: string | null = null;
      let telefono: string | null = null;

      if (Array.isArray(row)) {
        cedula = (row[0] || '').toString().trim().toUpperCase();
        nombre_completo = (row[1] || '').toString().trim().toUpperCase();
        cargo = (row[2] || 'DOCENTE').toString().trim();
        desde = (row[3] || '').toString().trim();
        if (row[4] && row[4].toString().trim()) {
          tipo_profesion = row[4].toString().trim().toUpperCase();
        }
        if (row[5] && row[5].toString().trim()) {
          carrera_pregrado = row[5].toString().trim();
        }
        if (row[6] && row[6].toString().trim()) {
          pnfs = JSON.stringify([row[6].toString().trim()]);
        }
        if (row[7] && row[7].toString().trim()) {
          email = row[7].toString().trim();
        }
        if (row[8] && row[8].toString().trim()) {
          telefono = row[8].toString().trim();
        }
      } else if (typeof row === 'object') {
        cedula = (row.cedula || row.Cedula || row.CEDULA || '').toString().trim().toUpperCase();
        nombre_completo = (row.nombre_completo || row.nombre || row.Docente || '').toString().trim().toUpperCase();
        cargo = (row.cargo || 'DOCENTE').toString().trim();
        desde = (row.desde || row.fecha_ingreso || '').toString().trim();
        const rawProf = row.tipo_profesion || row.profesion || row.Profesion;
        if (rawProf && rawProf.toString().trim()) {
          tipo_profesion = rawProf.toString().trim().toUpperCase();
        }
        const rawCarr = row.carrera_pregrado || row.carrera || row.Carrera;
        if (rawCarr && rawCarr.toString().trim()) {
          carrera_pregrado = rawCarr.toString().trim();
        }
        if (row.pnf && row.pnf.toString().trim()) {
          pnfs = JSON.stringify([row.pnf.toString().trim()]);
        }
        if (row.email && row.email.toString().trim()) {
          email = row.email.toString().trim();
        }
        if (row.telefono && row.telefono.toString().trim()) {
          telefono = row.telefono.toString().trim();
        }
      }

      if (!cedula || !nombre_completo) continue;

      stmts.push({
        sql: `INSERT INTO docentes (
          cedula, nombre_completo, cargo, desde, tipo_profesion, carrera_pregrado, pnfs, email, telefono,
          status, encuestado, registrado_por, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          'ACTIVO', 0, ?, datetime('now')
        ) ON CONFLICT(cedula) DO UPDATE SET
          nombre_completo = excluded.nombre_completo,
          cargo = CASE WHEN excluded.cargo != '' THEN excluded.cargo ELSE docentes.cargo END,
          desde = CASE WHEN excluded.desde != '' THEN excluded.desde ELSE docentes.desde END,
          tipo_profesion = CASE WHEN excluded.tipo_profesion IS NOT NULL AND excluded.tipo_profesion != '' THEN excluded.tipo_profesion ELSE docentes.tipo_profesion END,
          carrera_pregrado = CASE WHEN excluded.carrera_pregrado IS NOT NULL AND excluded.carrera_pregrado != '' THEN excluded.carrera_pregrado ELSE docentes.carrera_pregrado END,
          updated_at = datetime('now')`,
        args: [
          cedula,
          nombre_completo,
          cargo,
          desde,
          tipo_profesion,
          carrera_pregrado,
          pnfs,
          email,
          telefono,
          registrado_por || 'IMPORTACION_CSV',
        ],
      });

      processed++;
    }

    if (stmts.length === 0) {
      return res.status(400).json({ error: 'Ninguna fila contenía cédula y nombre válido' });
    }

    // Execute in batches of 50
    const batchSize = 50;
    for (let i = 0; i < stmts.length; i += batchSize) {
      const chunk = stmts.slice(i, i + batchSize);
      await db.batch(chunk);
    }

    return res.status(200).json({
      success: true,
      totalProcesados: processed,
      message: `Se importaron/actualizaron ${processed} docentes exitosamente`,
    });
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return res.status(500).json({ error: error.message || 'Error en la importación masiva' });
  }
}


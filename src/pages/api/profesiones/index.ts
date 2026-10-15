import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profesiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Ensure initial default professions
    const defaults = ['INGENIERO', 'LICENCIADO', 'MEDICO', 'ARQUITECTO', 'ABOGADO', 'TSU'];
    for (const d of defaults) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO profesiones (nombre) VALUES (?)',
        args: [d],
      });
    }

    if (req.method === 'GET') {
      // Fetch stored professions and any custom ones from docentes
      const stored = await db.execute('SELECT nombre FROM profesiones ORDER BY nombre ASC');
      const fromDocentes = await db.execute(`
        SELECT DISTINCT UPPER(tipo_profesion) as nombre 
        FROM docentes 
        WHERE tipo_profesion IS NOT NULL AND TRIM(tipo_profesion) != '' AND UPPER(tipo_profesion) != 'OTRO'
      `);

      const set = new Set<string>();
      // Put base ones first in preferred order
      defaults.forEach(d => set.add(d));
      stored.rows.forEach(r => {
        if (r.nombre && typeof r.nombre === 'string') set.add(r.nombre.trim().toUpperCase());
      });
      fromDocentes.rows.forEach(r => {
        if (r.nombre && typeof r.nombre === 'string') set.add(r.nombre.trim().toUpperCase());
      });

      const list = Array.from(set);
      return res.status(200).json({ success: true, profesiones: list });
    }

    if (req.method === 'POST') {
      const { nombre } = req.body;
      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({ error: 'Nombre de profesión requerido' });
      }

      const cleanNombre = nombre.trim().toUpperCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO profesiones (nombre) VALUES (?)',
        args: [cleanNombre],
      });

      return res.status(200).json({
        success: true,
        nombre: cleanNombre,
        message: 'Profesión registrada correctamente',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/profesiones:', error);
    return res.status(500).json({ error: error.message || 'Error en /api/profesiones' });
  }
}


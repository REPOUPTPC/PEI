import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { q } = req.query;

      let sql = 'SELECT id, nombre, codigo, pensum FROM unidades_curriculares';
      const args: any[] = [];

      if (q && typeof q === 'string' && q.trim().length > 0) {
        sql += ' WHERE nombre LIKE ?';
        args.push(`%${q.trim()}%`);
      }

      sql += ' ORDER BY nombre ASC';

      const result = await db.execute({ sql, args });

      return res.status(200).json({
        success: true,
        unidades: result.rows,
        total: result.rows.length,
      });
    }

    if (req.method === 'POST') {
      const { nombre, codigo = '', pensum = '' } = req.body;

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre de la Unidad Curricular es requerido' });
      }

      const cleanNombre = nombre.trim().toUpperCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO unidades_curriculares (nombre, codigo, pensum) VALUES (?, ?, ?)',
        args: [cleanNombre, codigo.trim().toUpperCase(), pensum.trim().toUpperCase()],
      });

      const fetchResult = await db.execute({
        sql: 'SELECT id, nombre, codigo, pensum FROM unidades_curriculares WHERE UPPER(nombre) = ?',
        args: [cleanNombre],
      });

      return res.status(201).json({
        success: true,
        unidad: fetchResult.rows[0] || { nombre: cleanNombre },
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API unidades-curriculares:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

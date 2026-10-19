import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { q } = req.query;

      let sql = 'SELECT id, nombre, tipo, created_at FROM carreras';
      let args: any[] = [];

      if (q && typeof q === 'string' && q.trim().length > 0) {
        sql += ' WHERE nombre LIKE ? ORDER BY nombre ASC LIMIT 30';
        args = [`%${q.trim()}%`];
      } else {
        sql += ' ORDER BY nombre ASC';
      }

      const result = await db.execute({ sql, args });
      return res.status(200).json({ success: true, carreras: result.rows });
    }

    if (req.method === 'POST') {
      const { nombre, tipo } = req.body;

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({ error: 'Nombre de carrera requerido' });
      }

      const cleanNombre = nombre.trim();
      let determinedTipo = tipo || 'OTRA';

      if (!tipo) {
        const upper = cleanNombre.toUpperCase();
        if (upper.includes('INGENI')) determinedTipo = 'INGENIERO';
        else if (upper.includes('LICENC')) determinedTipo = 'LICENCIADO';
        else if (upper.includes('MEDIC')) determinedTipo = 'MEDICO';
        else if (upper.includes('ARQUITECT')) determinedTipo = 'ARQUITECTO';
        else if (upper.includes('ABOGAD') || upper.includes('DERECHO')) determinedTipo = 'ABOGADO';
        else if (upper.includes('TÉCNICO') || upper.includes('TECNICO') || upper.includes('TSU')) determinedTipo = 'TSU';
      }

      // Check if already exists
      const check = await db.execute({
        sql: 'SELECT id, nombre, tipo FROM carreras WHERE LOWER(nombre) = LOWER(?)',
        args: [cleanNombre],
      });

      if (check.rows.length > 0) {
        return res.status(200).json({
          success: true,
          carrera: check.rows[0],
          isNew: false,
          message: 'La carrera ya existía en la base de datos',
        });
      }

      const insert = await db.execute({
        sql: 'INSERT INTO carreras (nombre, tipo) VALUES (?, ?)',
        args: [cleanNombre, determinedTipo],
      });

      const newId = insert.lastInsertRowid !== undefined && insert.lastInsertRowid !== null
        ? Number(insert.lastInsertRowid)
        : null;

      return res.status(201).json({
        success: true,
        carrera: {
          id: newId,
          nombre: cleanNombre,
          tipo: determinedTipo,
        },
        isNew: true,
        message: 'Carrera registrada exitosamente en la base de datos',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en carreras API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}


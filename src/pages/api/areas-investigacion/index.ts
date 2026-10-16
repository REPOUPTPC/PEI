import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT id, nombre, parent_id, nivel FROM areas_interes_investigativo ORDER BY nivel ASC, nombre ASC',
        args: [],
      });

      return res.status(200).json({
        success: true,
        areas: result.rows,
      });
    }

    if (req.method === 'POST') {
      const { nombre, parent_id = null, nivel = 4 } = req.body;

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del área es obligatorio' });
      }

      const cleanNombre = nombre.trim();

      // Verificar si ya existe
      const existing = await db.execute({
        sql: 'SELECT id, nombre, parent_id, nivel FROM areas_interes_investigativo WHERE LOWER(nombre) = LOWER(?)',
        args: [cleanNombre],
      });

      if (existing.rows.length > 0) {
        return res.status(200).json({
          success: true,
          area: existing.rows[0],
          message: 'El área ya existe en el catálogo',
        });
      }

      const insertRes = await db.execute({
        sql: 'INSERT INTO areas_interes_investigativo (nombre, parent_id, nivel) VALUES (?, ?, ?)',
        args: [cleanNombre, parent_id ? Number(parent_id) : null, Number(nivel) || 4],
      });

      const newId = Number(insertRes.lastInsertRowid);

      return res.status(201).json({
        success: true,
        area: {
          id: newId,
          nombre: cleanNombre,
          parent_id: parent_id ? Number(parent_id) : null,
          nivel: Number(nivel) || 4,
        },
        message: 'Nueva área de interés investigativo registrada con éxito',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en areas-investigacion API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

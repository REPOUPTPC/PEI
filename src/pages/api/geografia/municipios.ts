import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id_estado } = req.query;

    let sql = 'SELECT id_municipio, id_estado, municipio FROM municipios';
    let args: any[] = [];

    if (id_estado) {
      sql += ' WHERE id_estado = ?';
      args = [parseInt(id_estado as string)];
    }

    sql += ' ORDER BY municipio ASC';

    const result = await db.execute({ sql, args });
    return res.status(200).json({ success: true, municipios: result.rows });
  } catch (error: any) {
    console.error('Error en municipios API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

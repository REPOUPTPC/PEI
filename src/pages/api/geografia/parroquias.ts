import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id_municipio } = req.query;

    let sql = 'SELECT id_parroquia, id_municipio, parroquia FROM parroquias';
    let args: any[] = [];

    if (id_municipio) {
      sql += ' WHERE id_municipio = ?';
      args = [parseInt(id_municipio as string)];
    }

    sql += ' ORDER BY parroquia ASC';

    const result = await db.execute({ sql, args });
    return res.status(200).json({ success: true, parroquias: result.rows });
  } catch (error: any) {
    console.error('Error en parroquias API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}


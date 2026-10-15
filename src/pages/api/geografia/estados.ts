import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await db.execute({
      sql: 'SELECT id_estado, estado, iso_3166_2 FROM estados ORDER BY estado ASC',
      args: [],
    });

    return res.status(200).json({ success: true, estados: result.rows });
  } catch (error: any) {
    console.error('Error en estados API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}


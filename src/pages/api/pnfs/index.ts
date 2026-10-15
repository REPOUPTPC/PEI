import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await db.execute({
      sql: 'SELECT id, codigo, nombre, tipo FROM pnfs ORDER BY id ASC',
      args: [],
    });

    return res.status(200).json({ success: true, pnfs: result.rows });
  } catch (error: any) {
    console.error('Error en pnfs API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

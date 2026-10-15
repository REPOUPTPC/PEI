import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT clave, valor FROM configuracion',
        args: [],
      });

      const configMap: Record<string, any> = {};
      result.rows.forEach(row => {
        try {
          configMap[row.clave as string] = JSON.parse(row.valor as string);
        } catch {
          configMap[row.clave as string] = row.valor;
        }
      });

      return res.status(200).json({ success: true, config: configMap });
    }

    if (req.method === 'POST') {
      const { clave, valor } = req.body;

      if (!clave) {
        return res.status(400).json({ error: 'Clave requerida' });
      }

      const strVal = typeof valor === 'string' ? valor : JSON.stringify(valor);

      await db.execute({
        sql: 'INSERT OR REPLACE INTO configuracion (clave, valor, updated_at) VALUES (?, ?, datetime("now"))',
        args: [clave, strVal],
      });

      return res.status(200).json({ success: true, message: 'Configuración guardada' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en configuracion API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

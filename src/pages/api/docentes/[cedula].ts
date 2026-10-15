import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cedula } = req.query;

  if (!cedula || typeof cedula !== 'string') {
    return res.status(400).json({ error: 'Cédula no proporcionada' });
  }

  const cleanCedula = cedula.trim().toUpperCase();

  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM docentes WHERE UPPER(cedula) = ?',
        args: [cleanCedula],
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Docente no encontrado' });
      }

      return res.status(200).json({ success: true, docente: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      await db.execute({
        sql: 'DELETE FROM docentes WHERE UPPER(cedula) = ?',
        args: [cleanCedula],
      });

      return res.status(200).json({ success: true, message: 'Docente eliminado correctamente' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en docente cedula API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

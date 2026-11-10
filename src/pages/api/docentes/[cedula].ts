import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cedula } = req.query;

  if (!cedula || typeof cedula !== 'string') {
    return res.status(400).json({ error: 'Cédula no proporcionada' });
  }

  const rawInput = cedula.trim().toUpperCase();
  const digitsOnly = rawInput.replace(/\D/g, '');
  const withV = digitsOnly ? `V-${digitsOnly}` : rawInput;
  const withE = digitsOnly ? `E-${digitsOnly}` : rawInput;

  try {
    if (req.method === 'GET') {
      // Búsqueda flexible por cédula exacta, con prefijo V-, E- o solo dígitos
      const result = await db.execute({
        sql: `
          SELECT * FROM docentes 
          WHERE UPPER(cedula) = ?
             OR UPPER(cedula) = ?
             OR UPPER(cedula) = ?
             OR REPLACE(REPLACE(REPLACE(UPPER(cedula), 'V-', ''), 'E-', ''), ' ', '') = ?
          ORDER BY 
            COALESCE(porcentaje_completitud, 0) DESC,
            COALESCE(encuestado, 0) DESC,
            datetime(COALESCE(updated_at, created_at, '1970-01-01')) DESC
          LIMIT 1
        `,
        args: [rawInput, withV, withE, digitsOnly || rawInput],
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Docente no encontrado' });
      }

      return res.status(200).json({ success: true, docente: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      await db.execute({
        sql: `
          DELETE FROM docentes 
          WHERE UPPER(cedula) = ?
             OR UPPER(cedula) = ?
             OR UPPER(cedula) = ?
             OR REPLACE(REPLACE(REPLACE(UPPER(cedula), 'V-', ''), 'E-', ''), ' ', '') = ?
        `,
        args: [rawInput, withV, withE, digitsOnly || rawInput],
      });

      return res.status(200).json({ success: true, message: 'Docente eliminado correctamente' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en docente cedula API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

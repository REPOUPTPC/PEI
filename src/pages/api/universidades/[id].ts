import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID de universidad requerido' });
  }

  const numId = Number(id);

  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT id, nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url, created_at FROM universidades_venezuela WHERE id = ?',
        args: [numId],
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Universidad no encontrada' });
      }

      return res.status(200).json({ success: true, universidad: result.rows[0] });
    }

    if (req.method === 'PUT') {
      const { nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url } = req.body;

      if (!nombre) {
        return res.status(400).json({ error: 'Nombre de universidad requerido' });
      }

      const cleanTipo = tipo === 'Privada' ? 'Privada' : 'Pública';

      await db.execute({
        sql: `UPDATE universidades_venezuela SET nombre = ?, siglas = ?, codigo = ?, tipo = ?, subtipo = ?, sede_principal = ?, estado = ?, logo_url = ?, fachada_url = ?, fuente_url = ? WHERE id = ?`,
        args: [
          nombre.trim(),
          siglas ? siglas.trim().toUpperCase() : null,
          codigo ? codigo.trim().toUpperCase() : (siglas ? siglas.trim().toUpperCase() : null),
          cleanTipo,
          subtipo ? subtipo.trim() : null,
          sede_principal ? sede_principal.trim() : null,
          estado ? estado.trim() : null,
          logo_url ? logo_url.trim() : null,
          fachada_url ? fachada_url.trim() : null,
          fuente_url ? fuente_url.trim() : null,
          numId,
        ],
      });

      return res.status(200).json({ success: true, message: 'Universidad actualizada' });
    }

    if (req.method === 'DELETE') {
      await db.execute({
        sql: 'DELETE FROM universidades_venezuela WHERE id = ?',
        args: [numId],
      });

      return res.status(200).json({ success: true, message: 'Universidad eliminada' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en /api/universidades/[id]:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

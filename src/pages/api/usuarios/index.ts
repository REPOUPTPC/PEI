import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT id, username, nombre_completo, rol, activo, created_at, updated_at FROM usuarios ORDER BY id ASC',
        args: [],
      });
      return res.status(200).json({ success: true, usuarios: result.rows });
    }

    if (req.method === 'POST') {
      const { username, password, nombre_completo, rol, activo } = req.body;

      if (!username || !password || !nombre_completo || !rol) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      if (!['SUPERADMIN', 'ADMIN', 'ENCUESTADOR'].includes(rol)) {
        return res.status(400).json({ error: 'Rol no válido' });
      }

      const existing = await db.execute({
        sql: 'SELECT id FROM usuarios WHERE username = ?',
        args: [username.trim()],
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }

      const insert = await db.execute({
        sql: `INSERT INTO usuarios (username, password, nombre_completo, rol, activo)
              VALUES (?, ?, ?, ?, ?)`,
        args: [username.trim(), password.trim(), nombre_completo.trim(), rol, activo ? 1 : 0],
      });

      const newId = insert.lastInsertRowid !== undefined && insert.lastInsertRowid !== null
        ? Number(insert.lastInsertRowid)
        : null;

      return res.status(201).json({ success: true, id: newId });
    }

    if (req.method === 'PUT') {
      const { id, username, password, nombre_completo, rol, activo } = req.body;

      if (!id || !username || !nombre_completo || !rol) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      if (password && password.trim().length > 0) {
        await db.execute({
          sql: `UPDATE usuarios SET username = ?, password = ?, nombre_completo = ?, rol = ?, activo = ?, updated_at = datetime('now')
                WHERE id = ?`,
          args: [username.trim(), password.trim(), nombre_completo.trim(), rol, activo ? 1 : 0, id],
        });
      } else {
        await db.execute({
          sql: `UPDATE usuarios SET username = ?, nombre_completo = ?, rol = ?, activo = ?, updated_at = datetime('now')
                WHERE id = ?`,
          args: [username.trim(), nombre_completo.trim(), rol, activo ? 1 : 0, id],
        });
      }

      return res.status(200).json({ success: true, message: 'Usuario actualizado' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      // Check if trying to delete primary superadmin
      const check = await db.execute({
        sql: 'SELECT username FROM usuarios WHERE id = ?',
        args: [id as string],
      });

      if (check.rows.length > 0 && check.rows[0].username === 'CIENCIA_TECNOLOGIA') {
        return res.status(400).json({ error: 'No se puede eliminar al SUPERADMIN principal del sistema' });
      }

      await db.execute({
        sql: 'DELETE FROM usuarios WHERE id = ?',
        args: [id as string],
      });

      return res.status(200).json({ success: true, message: 'Usuario eliminado' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en usuarios API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}


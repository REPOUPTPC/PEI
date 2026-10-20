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
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
      }

      const cleanUsername = String(username).trim().toUpperCase();
      const cleanNombre = String(nombre_completo).trim();
      const cleanPassword = String(password).trim();
      const cleanRol = String(rol).trim().toUpperCase();

      if (!['SUPERADMIN', 'ADMIN', 'ENCUESTADOR'].includes(cleanRol)) {
        return res.status(400).json({ success: false, error: 'Rol no válido' });
      }

      const existing = await db.execute({
        sql: 'SELECT id FROM usuarios WHERE UPPER(username) = UPPER(?)',
        args: [cleanUsername],
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'El nombre de usuario ya existe' });
      }

      const isActivo = activo === 0 || activo === false ? 0 : 1;

      const insert = await db.execute({
        sql: `INSERT INTO usuarios (username, password, nombre_completo, rol, activo)
              VALUES (?, ?, ?, ?, ?)`,
        args: [cleanUsername, cleanPassword, cleanNombre, cleanRol, isActivo],
      });

      let newId: number | null = null;
      if (insert.lastInsertRowid !== undefined && insert.lastInsertRowid !== null) {
        try {
          newId = Number(insert.lastInsertRowid);
        } catch {
          newId = null;
        }
      }

      return res.status(201).json({
        success: true,
        id: newId,
        message: `Usuario ${cleanUsername} creado exitosamente`,
      });
    }

    if (req.method === 'PUT') {
      const { id, username, password, nombre_completo, rol, activo } = req.body;

      if (!id || !username || !nombre_completo || !rol) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
      }

      const cleanUsername = String(username).trim().toUpperCase();
      const cleanNombre = String(nombre_completo).trim();
      const cleanRol = String(rol).trim().toUpperCase();
      const isActivo = activo === 0 || activo === false ? 0 : 1;

      if (password && String(password).trim().length > 0) {
        await db.execute({
          sql: `UPDATE usuarios SET username = ?, password = ?, nombre_completo = ?, rol = ?, activo = ?, updated_at = datetime('now')
                WHERE id = ?`,
          args: [cleanUsername, String(password).trim(), cleanNombre, cleanRol, isActivo, id],
        });
      } else {
        await db.execute({
          sql: `UPDATE usuarios SET username = ?, nombre_completo = ?, rol = ?, activo = ?, updated_at = datetime('now')
                WHERE id = ?`,
          args: [cleanUsername, cleanNombre, cleanRol, isActivo, id],
        });
      }

      return res.status(200).json({ success: true, message: 'Usuario actualizado' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requerido' });
      }

      // Proteger al superadmin principal
      const check = await db.execute({
        sql: 'SELECT username FROM usuarios WHERE id = ?',
        args: [id as string],
      });

      if (check.rows.length > 0 && check.rows[0].username === 'CIENCIA_TECNOLOGIA') {
        return res.status(400).json({ success: false, error: 'No se puede eliminar al SUPERADMIN principal del sistema' });
      }

      await db.execute({
        sql: 'DELETE FROM usuarios WHERE id = ?',
        args: [id as string],
      });

      return res.status(200).json({ success: true, message: 'Usuario eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en usuarios API:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error del servidor' });
  }
}

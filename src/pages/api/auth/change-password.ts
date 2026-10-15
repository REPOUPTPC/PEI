import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const check = await db.execute({
      sql: 'SELECT id, password FROM usuarios WHERE username = ?',
      args: [username],
    });

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (check.rows[0].password !== currentPassword) {
      return res.status(401).json({ error: 'La contraseña actual no coincide' });
    }

    await db.execute({
      sql: 'UPDATE usuarios SET password = ?, updated_at = datetime("now") WHERE username = ?',
      args: [newPassword, username],
    });

    return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

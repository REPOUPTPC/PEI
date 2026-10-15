import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await db.execute({
      sql: 'SELECT id, username, password, nombre_completo, rol, activo FROM usuarios WHERE username = ?',
      args: [username.trim()],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al Administrador.' });
    }

    // Verify password (plain text or hash)
    if (user.password !== password.trim()) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Load admin permissions if rol is ADMIN
    let permisos = null;
    if (user.rol === 'ADMIN' || user.rol === 'SUPERADMIN') {
      const cfg = await db.execute({
        sql: "SELECT valor FROM configuracion WHERE clave = 'admin_permisos'",
        args: [],
      });
      if (cfg.rows.length > 0) {
        try {
          permisos = JSON.parse(cfg.rows[0].valor as string);
        } catch (e) {
          permisos = null;
        }
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        permisos,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

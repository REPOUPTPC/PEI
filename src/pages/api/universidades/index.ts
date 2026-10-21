import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';
import fs from 'fs';
import path from 'path';

async function ensureUniversidadesTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS universidades_venezuela (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        siglas TEXT,
        codigo TEXT,
        tipo TEXT NOT NULL,
        subtipo TEXT,
        sede_principal TEXT,
        estado TEXT,
        logo_url TEXT,
        fachada_url TEXT,
        fuente_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Añadir columnas si ya existía sin ellas
    const colsToAdd = [
      'ALTER TABLE universidades_venezuela ADD COLUMN codigo TEXT;',
      'ALTER TABLE universidades_venezuela ADD COLUMN logo_url TEXT;',
      'ALTER TABLE universidades_venezuela ADD COLUMN fachada_url TEXT;',
      'ALTER TABLE universidades_venezuela ADD COLUMN fuente_url TEXT;',
    ];
    for (const alterSql of colsToAdd) {
      try {
        await db.execute(alterSql);
      } catch {}
    }

    // Comprobar si ya contiene datos
    const checkCount = await db.execute('SELECT COUNT(*) as c FROM universidades_venezuela');
    const count = Number(checkCount.rows[0]?.c || 0);

    if (count < 100) {
      const sqlPath = path.resolve('sql/universidades_venezuela.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const lines = sql.split('\n');
        const inserts: { sql: string; args: any[] }[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (
            (trimmed.startsWith('(') && trimmed.endsWith('),')) ||
            (trimmed.startsWith('(') && trimmed.endsWith(');'))
          ) {
            const clean = trimmed.replace(/^\(/, '').replace(/\)[;,]$/, '');
            const tokens = clean.match(/(NULL|'(?:''|[^'])*')/g);
            if (tokens && tokens.length >= 10) {
              const parts = tokens.map(t => (t === 'NULL' ? null : t.slice(1, -1).replace(/''/g, "'")));
              inserts.push({
                sql: `INSERT OR REPLACE INTO universidades_venezuela (nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]],
              });
            }
          }
        }

        for (let i = 0; i < inserts.length; i += 20) {
          const batch = inserts.slice(i, i + 20);
          await db.batch(batch);
        }
      }
    }
  } catch (err) {
    console.error('Error ensuring universidades_venezuela:', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureUniversidadesTable();

    // GET: Listar o buscar universidades
    if (req.method === 'GET') {
      const { q, tipo } = req.query;

      let sql = 'SELECT id, nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url, created_at FROM universidades_venezuela WHERE 1=1';
      const args: any[] = [];

      if (tipo && typeof tipo === 'string' && tipo.trim().length > 0) {
        sql += ' AND tipo = ?';
        args.push(tipo.trim());
      }

      if (q && typeof q === 'string' && q.trim().length > 0) {
        const term = `%${q.trim()}%`;
        sql += ' AND (nombre LIKE ? OR siglas LIKE ? OR codigo LIKE ? OR subtipo LIKE ? OR estado LIKE ?)';
        args.push(term, term, term, term, term);
      }

      sql += ' ORDER BY tipo ASC, nombre ASC';

      const result = await db.execute({ sql, args });
      return res.status(200).json({ success: true, universidades: result.rows });
    }

    // POST: Crear nueva universidad o restaurar catálogo
    if (req.method === 'POST') {
      const { action, nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url } = req.body;

      // Acción especial de restauración del catálogo oficial
      if (action === 'reset') {
        const sqlPath = path.resolve('sql/universidades_venezuela.sql');
        if (!fs.existsSync(sqlPath)) {
          return res.status(404).json({ error: 'Archivo SQL base no encontrado' });
        }

        await db.execute('DELETE FROM universidades_venezuela');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const lines = sql.split('\n');
        const inserts: { sql: string; args: any[] }[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (
            (trimmed.startsWith('(') && trimmed.endsWith('),')) ||
            (trimmed.startsWith('(') && trimmed.endsWith(');'))
          ) {
            const clean = trimmed.replace(/^\(/, '').replace(/\)[;,]$/, '');
            const tokens = clean.match(/(NULL|'(?:''|[^'])*')/g);
            if (tokens && tokens.length >= 10) {
              const parts = tokens.map(t => (t === 'NULL' ? null : t.slice(1, -1).replace(/''/g, "'")));
              inserts.push({
                sql: `INSERT OR REPLACE INTO universidades_venezuela (nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]],
              });
            }
          }
        }

        for (let i = 0; i < inserts.length; i += 20) {
          const batch = inserts.slice(i, i + 20);
          await db.batch(batch);
        }

        return res.status(200).json({
          success: true,
          message: `Catálogo oficial consolidado restaurado con éxito (${inserts.length} instituciones)`,
        });
      }

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre de la universidad es requerido' });
      }

      const cleanNombre = nombre.trim();
      const cleanTipo = tipo === 'Privada' ? 'Privada' : 'Pública';

      // Verificar si ya existe
      const check = await db.execute({
        sql: 'SELECT id, nombre, tipo FROM universidades_venezuela WHERE LOWER(nombre) = LOWER(?)',
        args: [cleanNombre],
      });

      if (check.rows.length > 0) {
        return res.status(200).json({
          success: true,
          universidad: check.rows[0],
          isNew: false,
          message: 'La universidad ya existe en el catálogo',
        });
      }

      const insert = await db.execute({
        sql: `INSERT INTO universidades_venezuela (nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          cleanNombre,
          siglas ? siglas.trim().toUpperCase() : null,
          codigo ? codigo.trim().toUpperCase() : (siglas ? siglas.trim().toUpperCase() : null),
          cleanTipo,
          subtipo ? subtipo.trim() : 'General',
          sede_principal ? sede_principal.trim() : null,
          estado ? estado.trim() : null,
          logo_url ? logo_url.trim() : null,
          fachada_url ? fachada_url.trim() : null,
          fuente_url ? fuente_url.trim() : null,
        ],
      });

      const newId = insert.lastInsertRowid !== undefined && insert.lastInsertRowid !== null
        ? Number(insert.lastInsertRowid)
        : null;

      return res.status(201).json({
        success: true,
        universidad: {
          id: newId,
          nombre: cleanNombre,
          siglas: siglas ? siglas.trim().toUpperCase() : null,
          codigo: codigo ? codigo.trim().toUpperCase() : (siglas ? siglas.trim().toUpperCase() : null),
          tipo: cleanTipo,
          subtipo: subtipo ? subtipo.trim() : 'General',
          sede_principal: sede_principal ? sede_principal.trim() : null,
          estado: estado ? estado.trim() : null,
          logo_url: logo_url || null,
          fachada_url: fachada_url || null,
          fuente_url: fuente_url || null,
        },
        isNew: true,
        message: 'Universidad registrada exitosamente en el sistema',
      });
    }

    // PUT: Actualizar universidad
    if (req.method === 'PUT') {
      const { id, nombre, siglas, codigo, tipo, subtipo, sede_principal, estado, logo_url, fachada_url, fuente_url } = req.body;

      if (!id || !nombre) {
        return res.status(400).json({ error: 'ID y Nombre de universidad requeridos' });
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
          Number(id),
        ],
      });

      return res.status(200).json({ success: true, message: 'Universidad actualizada exitosamente' });
    }

    // DELETE: Eliminar universidad
    if (req.method === 'DELETE') {
      const { id } = req.body || req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID de universidad requerido' });
      }

      await db.execute({
        sql: 'DELETE FROM universidades_venezuela WHERE id = ?',
        args: [Number(id)],
      });

      return res.status(200).json({ success: true, message: 'Universidad eliminada exitosamente' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en universidades API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}

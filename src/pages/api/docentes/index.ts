import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { q, profesion, rama, pnf, encuestado, limit = '200', offset = '0' } = req.query;

      let sql = 'SELECT * FROM docentes WHERE 1=1';
      const args: any[] = [];

      if (q && typeof q === 'string' && q.trim().length > 0) {
        const queryTerm = `%${q.trim()}%`;
        sql += ` AND (
          cedula LIKE ? OR 
          nombre_completo LIKE ? OR 
          nombres LIKE ? OR 
          apellidos LIKE ? OR
          carrera_pregrado LIKE ? OR
          linea_investigacion LIKE ?
        )`;
        args.push(queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm);
      }

      if (profesion && typeof profesion === 'string' && profesion !== 'TODAS') {
        sql += ' AND UPPER(tipo_profesion) = UPPER(?)';
        args.push(profesion);
      }

      if (rama && typeof rama === 'string' && rama !== 'TODAS') {
        sql += ' AND rama_especifica LIKE ?';
        args.push(`%${rama}%`);
      }

      if (pnf && typeof pnf === 'string' && pnf !== 'TODOS') {
        sql += ' AND pnfs LIKE ?';
        args.push(`%${pnf}%`);
      }

      if (encuestado !== undefined && encuestado !== '') {
        sql += ' AND encuestado = ?';
        args.push(parseInt(encuestado as string));
      }

      sql += ' ORDER BY nombre_completo ASC LIMIT ? OFFSET ?';
      args.push(parseInt(limit as string), parseInt(offset as string));

      const result = await db.execute({ sql, args });

      // Total count query for pagination and metrics
      const countRes = await db.execute({
        sql: 'SELECT COUNT(*) as total, SUM(CASE WHEN encuestado = 1 THEN 1 ELSE 0 END) as encuestados FROM docentes',
        args: [],
      });

      return res.status(200).json({
        success: true,
        docentes: result.rows,
        total: countRes.rows[0]?.total || 0,
        encuestados: countRes.rows[0]?.encuestados || 0,
      });
    }

    if (req.method === 'POST') {
      const data = req.body;
      const {
        cedula,
        nombre_completo,
        nombres,
        apellidos,
        fecha_nacimiento,
        genero,
        email,
        telefono,
        foto_url,
        cargo,
        desde,
        status,
        id_estado,
        estado_nombre,
        id_municipio,
        municipio_nombre,
        id_parroquia,
        parroquia_nombre,
        direccion,
        tipo_profesion,
        carrera_pregrado,
        rama_especifica,
        universidad_pregrado,
        anio_pregrado,
        titulos_adicionales,
        posee_especialidad,
        especialidades,
        posee_maestria,
        maestrias,
        posee_doctorado,
        doctorados,
        componente_docente,
        usuario_recitven,
        publicaciones_repositorio,
        colegiado,
        nombre_colegio,
        numero_colegio,
        pnfs,
        conoce_lineas_pnf,
        lineas_pnf_detalle,
        asignaturas_imparte,
        linea_investigacion,
        areas_interes_investigativo,
        investigacion_en_desarrollo,
        investigacion_instituto,
        investigacion_titulo,
        investigacion_linea,
        publicaciones_libros,
        libros_detalle,
        publicaciones_articulos,
        articulos_detalle,
        participado_ponente,
        participado_participante,
        eventos_detalle,
        desarrollo_academico_actual,
        desarrollo_academico_detalle,
        tutoria_proyectos_activa,
        tutorias_detalle,
        posee_diplomados,
        diplomados_detalle,
        potencialidades,
        observaciones,
        registrado_por,
      } = data;

      if (!cedula || !nombre_completo) {
        return res.status(400).json({ error: 'Cédula y Nombre Completo son requeridos' });
      }

      // Check if carrera needs to be added to carreras table
      const cleanTipoProfesion = (tipo_profesion && typeof tipo_profesion === 'string' && tipo_profesion.trim())
        ? tipo_profesion.trim().toUpperCase()
        : 'OTRO';

      if (carrera_pregrado && carrera_pregrado.trim().length > 0) {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO carreras (nombre, tipo) VALUES (?, ?)',
          args: [carrera_pregrado.trim(), cleanTipoProfesion],
        });
      }

      // Store in profesiones table so it is available for other teachers
      if (cleanTipoProfesion !== 'OTRO') {
        try {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS profesiones (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              nombre TEXT UNIQUE NOT NULL,
              created_at TEXT DEFAULT (datetime('now'))
            );
          `);
          await db.execute({
            sql: 'INSERT OR IGNORE INTO profesiones (nombre) VALUES (?)',
            args: [cleanTipoProfesion],
          });
        } catch (err) {
          console.error('Error inserting into profesiones:', err);
        }
      }

      const cleanCedula = cedula.trim().toUpperCase();

      try {
        await db.execute('ALTER TABLE docentes ADD COLUMN publicaciones_repositorio INTEGER DEFAULT 0;');
      } catch {
        // Ignorar si la columna ya existe
      }

      await db.execute({
        sql: `INSERT OR REPLACE INTO docentes (
          cedula, nombres, apellidos, nombre_completo, fecha_nacimiento, genero, email, telefono, foto_url,
          cargo, desde, status,
          id_estado, estado_nombre, id_municipio, municipio_nombre, id_parroquia, parroquia_nombre, direccion,
          tipo_profesion, carrera_pregrado, rama_especifica, universidad_pregrado, anio_pregrado, titulos_adicionales,
          posee_especialidad, especialidades, posee_maestria, maestrias, posee_doctorado, doctorados,
          componente_docente, usuario_recitven, publicaciones_repositorio, colegiado, nombre_colegio, numero_colegio,
          pnfs, conoce_lineas_pnf, lineas_pnf_detalle, asignaturas_imparte, linea_investigacion, areas_interes_investigativo, investigacion_en_desarrollo, investigacion_instituto, investigacion_titulo, investigacion_linea,
          publicaciones_libros, libros_detalle, publicaciones_articulos, articulos_detalle,
          participado_ponente, participado_participante, eventos_detalle,
          desarrollo_academico_actual, desarrollo_academico_detalle,
          tutoria_proyectos_activa, tutorias_detalle,
          posee_diplomados, diplomados_detalle, potencialidades, observaciones,
          encuestado, registrado_por, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?, ?,
          1, ?, datetime('now')
        )`,
        args: [
          cleanCedula,
          nombres || '',
          apellidos || '',
          nombre_completo.trim().toUpperCase(),
          fecha_nacimiento || null,
          genero || 'No especificado',
          email || null,
          telefono || null,
          foto_url || null,
          cargo || 'DOCENTE',
          desde || null,
          status || 'ACTIVO',
          id_estado || null,
          estado_nombre || null,
          id_municipio || null,
          municipio_nombre || null,
          id_parroquia || null,
          parroquia_nombre || null,
          direccion || null,
          cleanTipoProfesion,
          carrera_pregrado || null,
          rama_especifica || null,
          universidad_pregrado || null,
          anio_pregrado ? parseInt(anio_pregrado) : null,
          typeof titulos_adicionales === 'string' ? titulos_adicionales : JSON.stringify(titulos_adicionales || []),
          posee_especialidad ? 1 : 0,
          typeof especialidades === 'string' ? especialidades : JSON.stringify(especialidades || []),
          posee_maestria ? 1 : 0,
          typeof maestrias === 'string' ? maestrias : JSON.stringify(maestrias || []),
          posee_doctorado ? 1 : 0,
          typeof doctorados === 'string' ? doctorados : JSON.stringify(doctorados || []),
          componente_docente ? 1 : 0,
          usuario_recitven ? 1 : 0,
          publicaciones_repositorio ? 1 : 0,
          colegiado ? 1 : 0,
          nombre_colegio || null,
          numero_colegio || null,
          typeof pnfs === 'string' ? pnfs : JSON.stringify(pnfs || []),
          conoce_lineas_pnf ? 1 : 0,
          lineas_pnf_detalle || null,
          typeof asignaturas_imparte === 'string' ? asignaturas_imparte : JSON.stringify(asignaturas_imparte || []),
          linea_investigacion || null,
          typeof areas_interes_investigativo === 'string' ? areas_interes_investigativo : JSON.stringify(areas_interes_investigativo || []),
          investigacion_en_desarrollo ? 1 : 0,
          investigacion_instituto || null,
          investigacion_titulo || null,
          investigacion_linea || null,
          publicaciones_libros ? 1 : 0,
          typeof libros_detalle === 'string' ? libros_detalle : JSON.stringify(libros_detalle || []),
          publicaciones_articulos ? 1 : 0,
          typeof articulos_detalle === 'string' ? articulos_detalle : JSON.stringify(articulos_detalle || []),
          participado_ponente ? 1 : 0,
          participado_participante ? 1 : 0,
          typeof eventos_detalle === 'string' ? eventos_detalle : JSON.stringify(eventos_detalle || []),
          desarrollo_academico_actual ? 1 : 0,
          typeof desarrollo_academico_detalle === 'string' ? desarrollo_academico_detalle : JSON.stringify(desarrollo_academico_detalle || []),
          tutoria_proyectos_activa ? 1 : 0,
          typeof tutorias_detalle === 'string' ? tutorias_detalle : JSON.stringify(tutorias_detalle || []),
          posee_diplomados ? 1 : 0,
          typeof diplomados_detalle === 'string' ? diplomados_detalle : JSON.stringify(diplomados_detalle || []),
          potencialidades || null,
          observaciones || null,
          registrado_por || 'SISTEMA',
        ],
      });

      return res.status(200).json({ success: true, message: 'Ficha de docente guardada exitosamente' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error en docentes API:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}


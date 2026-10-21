import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tipo_limpieza, confirmacion, rol } = req.body;

    // Validación estricta de seguridad
    if (rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo el SUPERADMIN puede ejecutar la limpieza para pase a producción' });
    }

    const cleanConfirm = (confirmacion || '').toString().trim().toUpperCase();
    if (cleanConfirm !== 'PRODUCCION' && cleanConfirm !== 'LIMPIAR') {
      return res.status(400).json({
        error: 'Debe escribir exactamente la palabra de confirmación requerida (PRODUCCION o LIMPIAR)',
      });
    }

    // 1. Obtener conteo previo para auditoría
    const countRes = await db.execute('SELECT COUNT(*) as total FROM docentes');
    const totalRegistros = Number(countRes.rows[0]?.total || 0);

    if (tipo_limpieza === 'VACIAR_TODO') {
      // Elimina la totalidad de los docentes para inicio limpio en producción
      await db.execute('DELETE FROM docentes');

      return res.status(200).json({
        success: true,
        message: `Se eliminaron exitosamente los ${totalRegistros} docentes de prueba. La base de datos está en 0 para iniciar producción.`,
        totalAfectados: totalRegistros,
      });
    }

    if (tipo_limpieza === 'REINICIAR_CENSO') {
      // Mantiene la lista básica de docentes (cédula, nombre, cargo, fecha ingreso)
      // pero limpia todas las respuestas de censo y lo marca como no encuestado
      const updateRes = await db.execute(`
        UPDATE docentes SET
          encuestado = 0,
          foto_url = NULL,
          fecha_nacimiento = NULL,
          genero = NULL,
          email = NULL,
          telefono = NULL,
          id_estado_procedencia = NULL,
          estado_procedencia_nombre = NULL,
          id_municipio_procedencia = NULL,
          municipio_procedencia_nombre = NULL,
          id_parroquia_procedencia = NULL,
          parroquia_procedencia_nombre = NULL,
          id_estado = NULL,
          estado_nombre = NULL,
          id_municipio = NULL,
          municipio_nombre = NULL,
          id_parroquia = NULL,
          parroquia_nombre = NULL,
          direccion = NULL,
          tipo_profesion = NULL,
          carrera_pregrado = NULL,
          rama_especifica = NULL,
          universidad_pregrado = NULL,
          anio_pregrado = NULL,
          titulos_adicionales = NULL,
          posee_especialidad = 0,
          especialidades = NULL,
          posee_maestria = 0,
          maestrias = NULL,
          posee_doctorado = 0,
          doctorados = NULL,
          componente_docente = 0,
          usuario_recitven = 0,
          publicaciones_repositorio = 0,
          colegiado = 0,
          nombre_colegio = NULL,
          numero_colegio = NULL,
          pnfs = NULL,
          conoce_lineas_pnf = 0,
          lineas_pnf_detalle = NULL,
          asignaturas_imparte = NULL,
          linea_investigacion = NULL,
          areas_interes_investigativo = NULL,
          investigacion_en_desarrollo = 0,
          investigacion_instituto = NULL,
          investigacion_titulo = NULL,
          investigacion_linea = NULL,
          publicaciones_libros = 0,
          libros_detalle = NULL,
          publicaciones_articulos = 0,
          articulos_detalle = NULL,
          participado_ponente = 0,
          participado_participante = 0,
          eventos_detalle = NULL,
          desarrollo_academico_actual = 0,
          desarrollo_academico_detalle = NULL,
          tutoria_proyectos_activa = 0,
          tutorias_detalle = NULL,
          posee_diplomados = 0,
          diplomados_detalle = NULL,
          potencialidades = NULL,
          observaciones = NULL,
          updated_at = datetime('now')
      `);

      const filasAfectadas = Number(updateRes.rowsAffected || totalRegistros);

      return res.status(200).json({
        success: true,
        message: `Se restableció el censo de ${filasAfectadas} docentes a estado PENDIENTE. Los expedientes fueron reseteados preservando la nómina base.`,
        totalAfectados: filasAfectadas,
      });
    }

    return res.status(400).json({ error: 'Tipo de limpieza no válido' });
  } catch (error: any) {
    console.error('Error al limpiar datos de docentes:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor al limpiar datos' });
  }
}

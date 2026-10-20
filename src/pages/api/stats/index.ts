import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Totales generales
    const totalsRes = await db.execute(`
      SELECT 
        COUNT(*) as totalDocentes,
        SUM(CASE WHEN encuestado = 1 THEN 1 ELSE 0 END) as totalEncuestados,
        SUM(CASE WHEN encuestado = 0 THEN 1 ELSE 0 END) as totalPendientes,
        SUM(CASE WHEN componente_docente = 1 THEN 1 ELSE 0 END) as conComponenteDocente,
        SUM(CASE WHEN componente_docente = 0 AND encuestado = 1 THEN 1 ELSE 0 END) as sinComponenteDocente,
        SUM(CASE WHEN usuario_recitven = 1 THEN 1 ELSE 0 END) as enRecitven,
        SUM(CASE WHEN colegiado = 1 THEN 1 ELSE 0 END) as colegiados,
        SUM(CASE WHEN publicaciones_libros = 1 THEN 1 ELSE 0 END) as conPublicacionesLibros,
        SUM(CASE WHEN publicaciones_articulos = 1 THEN 1 ELSE 0 END) as conPublicacionesArticulos,
        SUM(CASE WHEN investigacion_en_desarrollo = 1 THEN 1 ELSE 0 END) as conInvestigacionActiva,
        SUM(CASE WHEN posee_doctorado = 1 THEN 1 ELSE 0 END) as totalDoctores,
        SUM(CASE WHEN posee_maestria = 1 THEN 1 ELSE 0 END) as totalMagisteres,
        SUM(CASE WHEN posee_especialidad = 1 THEN 1 ELSE 0 END) as totalEspecialistas
      FROM docentes
    `);

    const row = totalsRes.rows[0];
    const totalDocentes = Number(row?.totalDocentes || 0);
    const totalEncuestados = Number(row?.totalEncuestados || 0);
    const totalPendientes = Number(row?.totalPendientes || 0);
    const porcentajesEncuestados = totalDocentes > 0 ? Math.round((totalEncuestados / totalDocentes) * 100) : 0;

    // 2. Distribución de profesiones y ramas (solo docentes con datos académicos reales o censados)
    const profRes = await db.execute(`
      SELECT 
        COALESCE(NULLIF(TRIM(tipo_profesion), ''), 'OTRO') as tipo,
        COALESCE(NULLIF(TRIM(carrera_pregrado), ''), COALESCE(NULLIF(TRIM(rama_especifica), ''), 'General / Sin especificar')) as rama,
        COUNT(*) as total
      FROM docentes
      WHERE (encuestado = 1 OR (carrera_pregrado IS NOT NULL AND TRIM(carrera_pregrado) != ''))
        AND tipo_profesion IS NOT NULL
        AND TRIM(tipo_profesion) != ''
      GROUP BY tipo, rama
      ORDER BY total DESC
    `);

    const profesionesMap: Record<string, { total: number; ramas: Record<string, number> }> = {};
    profRes.rows.forEach(r => {
      const tipo = (r.tipo as string).toUpperCase();
      const rama = r.rama as string;
      const count = Number(r.total);

      if (!profesionesMap[tipo]) {
        profesionesMap[tipo] = { total: 0, ramas: {} };
      }
      profesionesMap[tipo].total += count;
      profesionesMap[tipo].ramas[rama] = (profesionesMap[tipo].ramas[rama] || 0) + count;
    });

    const distribucionProfesiones = Object.keys(profesionesMap).map(tipo => ({
      tipo,
      total: profesionesMap[tipo].total,
      ramas: Object.keys(profesionesMap[tipo].ramas).map(rama => ({
        rama,
        total: profesionesMap[tipo].ramas[rama],
      })),
    })).sort((a, b) => b.total - a.total);

    // 3. Distribución por máximo nivel académico
    const nivelesRes = await db.execute(`
      SELECT
        CASE 
          WHEN posee_doctorado = 1 THEN 'Doctorado (PhD)'
          WHEN posee_maestria = 1 THEN 'Maestría / MSc'
          WHEN posee_especialidad = 1 THEN 'Especialización'
          WHEN encuestado = 1 THEN 'Pregrado Universitario'
          ELSE 'Pendiente de Censo'
        END as nivel,
        COUNT(*) as total
      FROM docentes
      GROUP BY nivel
      ORDER BY total DESC
    `);

    // 4. Distribución por PNF
    const pnfDocentesRes = await db.execute(`
      SELECT pnfs FROM docentes WHERE pnfs IS NOT NULL AND pnfs != '' AND pnfs != '[]'
    `);

    const pnfCounts: Record<string, number> = {};
    pnfDocentesRes.rows.forEach(r => {
      try {
        const arr = JSON.parse(r.pnfs as string);
        if (Array.isArray(arr)) {
          arr.forEach((p: string) => {
            pnfCounts[p] = (pnfCounts[p] || 0) + 1;
          });
        }
      } catch {
        // ignore parse error
      }
    });

    const distribucionPNF = Object.keys(pnfCounts).map(pnf => ({
      pnf,
      total: pnfCounts[pnf],
    })).sort((a, b) => b.total - a.total);

    // 5. Líneas de investigación top
    const lineasRes = await db.execute(`
      SELECT linea_investigacion, COUNT(*) as total 
      FROM docentes 
      WHERE linea_investigacion IS NOT NULL AND linea_investigacion != '' 
      GROUP BY linea_investigacion 
      ORDER BY total DESC 
      LIMIT 10
    `);

    // 6. Distribución por Estado / Geográfica
    const geoRes = await db.execute(`
      SELECT 
        COALESCE(estado_nombre, 'Carabobo') as estado, 
        COALESCE(municipio_nombre, 'Puerto Cabello') as municipio, 
        COUNT(*) as total 
      FROM docentes 
      WHERE encuestado = 1 
      GROUP BY estado, municipio 
      ORDER BY total DESC 
      LIMIT 10
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalDocentes,
        totalEncuestados,
        totalPendientes,
        porcentajesEncuestados,
        conComponenteDocente: Number(row?.conComponenteDocente || 0),
        sinComponenteDocente: Number(row?.sinComponenteDocente || 0),
        enRecitven: Number(row?.enRecitven || 0),
        colegiados: Number(row?.colegiados || 0),
        conPublicacionesLibros: Number(row?.conPublicacionesLibros || 0),
        conPublicacionesArticulos: Number(row?.conPublicacionesArticulos || 0),
        conInvestigacionActiva: Number(row?.conInvestigacionActiva || 0),
        totalDoctores: Number(row?.totalDoctores || 0),
        totalMagisteres: Number(row?.totalMagisteres || 0),
        totalEspecialistas: Number(row?.totalEspecialistas || 0),
        distribucionProfesiones,
        distribucionNivelAcademico: nivelesRes.rows.map(r => ({
          nivel: r.nivel as string,
          total: Number(r.total),
        })),
        distribucionPNF,
        lineasInvestigacionTop: lineasRes.rows.map(r => ({
          linea: r.linea_investigacion as string,
          total: Number(r.total),
        })),
        distribucionGeografica: geoRes.rows.map(r => ({
          estado: r.estado as string,
          municipio: r.municipio as string,
          total: Number(r.total),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error generating stats:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
}


import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/turso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await db.execute('ALTER TABLE docentes ADD COLUMN publicaciones_repositorio INTEGER DEFAULT 0;');
    } catch {
      // Ignorar si la columna ya existe
    }

    // 1. Totales generales
    const totalsRes = await db.execute(`
      SELECT 
        COUNT(*) as totalDocentes,
        SUM(CASE WHEN encuestado = 1 THEN 1 ELSE 0 END) as totalEncuestados,
        SUM(CASE WHEN encuestado = 0 THEN 1 ELSE 0 END) as totalPendientes,
        SUM(CASE WHEN componente_docente = 1 THEN 1 ELSE 0 END) as conComponenteDocente,
        SUM(CASE WHEN componente_docente = 0 AND encuestado = 1 THEN 1 ELSE 0 END) as sinComponenteDocente,
        SUM(CASE WHEN usuario_recitven = 1 THEN 1 ELSE 0 END) as enRecitven,
        SUM(CASE WHEN publicaciones_repositorio = 1 THEN 1 ELSE 0 END) as conPublicacionesRepositorio,
        SUM(CASE WHEN (publicaciones_repositorio = 0 OR publicaciones_repositorio IS NULL) AND encuestado = 1 THEN 1 ELSE 0 END) as sinPublicacionesRepositorio,
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

    // 6. Distribución Geográfica de Residencia Actual (Estados y Municipios)
    const resResidencia = await db.execute(`
      SELECT 
        COALESCE(estado_nombre, 'Carabobo') as estado, 
        COALESCE(municipio_nombre, 'Puerto Cabello') as municipio, 
        COUNT(*) as total 
      FROM docentes 
      WHERE encuestado = 1 
      GROUP BY estado, municipio 
      ORDER BY total DESC
    `);

    // 6.b Distribución Geográfica de Procedencia / Origen
    const resProcedencia = await db.execute(`
      SELECT 
        COALESCE(estado_procedencia_nombre, estado_nombre, 'Carabobo') as estado, 
        COALESCE(municipio_procedencia_nombre, municipio_nombre, 'Puerto Cabello') as municipio, 
        COUNT(*) as total 
      FROM docentes 
      WHERE encuestado = 1 
      GROUP BY estado, municipio 
      ORDER BY total DESC
    `);

    // 6.c Análisis de Movilidad Geográfica (Lugar de Origen vs. Lugar de Residencia Actual)
    const movilidadRes = await db.execute(`
      SELECT 
        COALESCE(estado_procedencia_nombre, estado_nombre, 'Carabobo') as estado_procedencia,
        COALESCE(estado_nombre, 'Carabobo') as estado_residencia
      FROM docentes
      WHERE encuestado = 1
    `);

    const estadoProcedenciaMap: Record<string, number> = {};
    const estadoResidenciaMap: Record<string, number> = {};
    let mismos = 0;
    let diferentes = 0;

    movilidadRes.rows.forEach(r => {
      const proc = ((r.estado_procedencia as string) || 'Carabobo').trim();
      const res = ((r.estado_residencia as string) || 'Carabobo').trim();

      estadoProcedenciaMap[proc] = (estadoProcedenciaMap[proc] || 0) + 1;
      estadoResidenciaMap[res] = (estadoResidenciaMap[res] || 0) + 1;

      if (proc.toLowerCase() === res.toLowerCase()) {
        mismos++;
      } else {
        diferentes++;
      }
    });

    const todosEstados = Array.from(
      new Set([...Object.keys(estadoProcedenciaMap), ...Object.keys(estadoResidenciaMap)])
    ).sort();

    const comparativaGeografica = todosEstados
      .map(est => ({
        estado: est,
        procedencia: estadoProcedenciaMap[est] || 0,
        residencia: estadoResidenciaMap[est] || 0,
      }))
      .sort((a, b) => b.procedencia + b.residencia - (a.procedencia + a.residencia));

    const totalConDatos = mismos + diferentes;
    const tasaMovilidad = {
      mismos,
      diferentes,
      pctMovilidad: totalConDatos > 0 ? Math.round((diferentes / totalConDatos) * 100) : 0,
      totalConDatos,
    };

    // 7. Distribución Real de Universidades (Alma Máter) y Tipo (Pública / Privada)
    const univsRes = await db.execute(`
      SELECT 
        TRIM(universidad_pregrado) as univ,
        COUNT(*) as total
      FROM docentes
      WHERE universidad_pregrado IS NOT NULL AND TRIM(universidad_pregrado) != ''
      GROUP BY TRIM(universidad_pregrado)
      ORDER BY total DESC
    `);

    let totalPublica = 0;
    let totalPrivada = 0;
    let totalSinDefinir = 0;

    // Obtener catálogo de tipos para cruce
    let catalogoUnivMap: Record<string, string> = {};
    try {
      const catRes = await db.execute('SELECT nombre, siglas, tipo FROM universidades_venezuela');
      catRes.rows.forEach(r => {
        const nom = (r.nombre as string || '').toLowerCase();
        const sig = (r.siglas as string || '').toLowerCase();
        const tipo = (r.tipo as string || 'Pública');
        if (nom) catalogoUnivMap[nom] = tipo;
        if (sig) catalogoUnivMap[sig] = tipo;
      });
    } catch {}

    const distribucionUniversidades = univsRes.rows.map(r => {
      const univ = r.univ as string;
      const count = Number(r.total);
      const lower = univ.toLowerCase();

      let tipo = catalogoUnivMap[lower] || '';
      if (!tipo) {
        if (lower.includes('católica') || lower.includes('catolica') || lower.includes('metropolitana') || lower.includes('santa maría') || lower.includes('santa maria') || lower.includes('arturo michelena') || lower.includes('josé antonio páez') || lower.includes('jose antonio paez') || lower.includes('ujap') || lower.includes('uam') || lower.includes('urbe') || lower.includes('monteávila') || lower.includes('bicentenaria') || lower.includes('fermin toro') || lower.includes('fermín toro') || lower.includes('yacambú') || lower.includes('alejandro de humboldt') || lower.includes('panamericana del puerto') || lower.includes('unipap') || lower.includes('privada')) {
          tipo = 'Privada';
        } else if (lower.includes('upt') || lower.includes('iut') || lower.includes('ucv') || lower.includes('ula') || lower.includes('luz') || lower.includes('udo') || lower.includes('unexpo') || lower.includes('unefa') || lower.includes('unerg') || lower.includes('unellez') || lower.includes('unefm') || lower.includes('upel') || lower.includes('ubv') || lower.includes('unesr') || lower.includes('carabobo') || lower.includes('pública') || lower.includes('publica') || lower.includes('experimental') || lower.includes('nacional')) {
          tipo = 'Pública';
        } else {
          tipo = 'Otra / Internacional';
        }
      }

      if (tipo === 'Pública') totalPublica += count;
      else if (tipo === 'Privada') totalPrivada += count;
      else totalSinDefinir += count;

      return {
        univ,
        tipo,
        total: count,
      };
    });

    const distribucionTipoUniversidad = [
      { tipo: 'Universidad Pública', total: totalPublica },
      { tipo: 'Universidad Privada', total: totalPrivada },
      ...(totalSinDefinir > 0 ? [{ tipo: 'Otra / Extranjera', total: totalSinDefinir }] : []),
    ];

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
        conPublicacionesRepositorio: Number(row?.conPublicacionesRepositorio || 0),
        sinPublicacionesRepositorio: Number(row?.sinPublicacionesRepositorio || 0),
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
        distribucionGeografica: resResidencia.rows.map(r => ({
          estado: r.estado as string,
          municipio: r.municipio as string,
          total: Number(r.total),
        })),
        distribucionResidencia: resResidencia.rows.map(r => ({
          estado: r.estado as string,
          municipio: r.municipio as string,
          total: Number(r.total),
        })),
        distribucionProcedencia: resProcedencia.rows.map(r => ({
          estado: r.estado as string,
          municipio: r.municipio as string,
          total: Number(r.total),
        })),
        comparativaGeografica,
        tasaMovilidad,
        distribucionTipoUniversidad,
        distribucionUniversidades,
      },
    });
  } catch (error: any) {
    console.error('Error generating stats:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
}


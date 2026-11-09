/**
 * Utilidades compartidas (cliente y servidor) del Censo PEI UPTPC.
 *
 * - Cálculo del porcentaje de completitud de una planilla de censo.
 *   Una planilla se considera "CENSADA" únicamente cuando supera el UMBRAL (90%).
 *   Por debajo de ese umbral, si ya fue guardada al menos una vez, queda "EN PROGRESO".
 * - Catálogo de unidades / cargos directivos de la UPTPC.
 */

export const UMBRAL_CENSO_COMPLETO = 90;

/** Unidades administrativas / de gestión de la UPTPC (los PNF se agregan dinámicamente). */
export const UNIDADES_DIRECTIVAS_UPTPC: string[] = [
  'Infraestructura',
  'Deporte',
  'Talento Humano',
  'Administración',
  'Prácticas Profesionales',
  'Servicio Comunitario',
  'Cultura',
  'Bienestar Estudiantil',
  'Comunicación',
  'Ciencia y Tecnología',
];

/** Elemento de un cargo directivo fuera de la UPTPC */
export interface ItemCargoExterno {
  institucion: string; // Dónde
  cargo: string; // Unidad / cargo ejercido
  fecha_inicio: string; // Desde
  fecha_fin?: string; // Hasta (solo para cargos pasados)
  tiempo: string; // Tiempo en el cargo (ej. 2 años y 3 meses)
}

export type EstadoCenso = 'CENSADO' | 'EN_PROGRESO' | 'PENDIENTE';

const isTrue = (v: any) => v === 1 || v === true || v === '1' || v === 'true' || (typeof v === 'bigint' && v === BigInt(1));

/** Convierte un valor (array, JSON string o string) en arreglo, si aplica */
const toArray = (v: any): any[] | null => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('[')) {
      try {
        const p = JSON.parse(t);
        return Array.isArray(p) ? p : null;
      } catch {
        return null;
      }
    }
  }
  return null;
};

/** Determina si un valor de respuesta está efectivamente diligenciado */
export const isFilled = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return !isNaN(v) && v > 0;
  if (typeof v === 'bigint') return v > BigInt(0);
  if (typeof v === 'boolean') return v;
  const arr = toArray(v);
  if (arr) {
    // Al menos un elemento con contenido real
    return arr.some(item => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'object') {
        return Object.values(item).some(x => x !== null && x !== undefined && String(x).trim() !== '');
      }
      return String(item).trim() !== '';
    });
  }
  if (typeof v === 'string') {
    const t = v.trim();
    return t !== '' && t !== 'No especificado' && t !== 'null' && t !== 'undefined';
  }
  return true;
};

/** Al menos un cargo externo con institución indicada */
const cargosExternosCompletos = (v: any): boolean => {
  const arr = toArray(v);
  if (!arr || arr.length === 0) return false;
  return arr.some((it: any) => it && String(it.institucion || '').trim() !== '' && String(it.fecha_inicio || it.tiempo || '').trim() !== '');
};

export interface ResultadoCompletitud {
  porcentaje: number; // 0 - 100 con un decimal
  completos: number;
  total: number;
  faltantes: string[];
  completo: boolean; // > UMBRAL
}

/**
 * Calcula la completitud de una planilla de censo.
 * Acepta tanto el payload del formulario (booleanos/arrays) como una fila de BD (0/1, JSON strings).
 *
 * Reglas:
 * - Se cuentan todas las preguntas principales de contenido (texto, selección, listas).
 * - Las preguntas Sí/No se consideran respondidas siempre (el "No" es válido);
 *   cuando la respuesta es "Sí", el detalle correspondiente pasa a ser obligatorio.
 * - La fotografía del docente cuenta como parte del 90%.
 */
export function calcularCompletitud(d: Record<string, any> | null | undefined): ResultadoCompletitud {
  const items: { label: string; ok: boolean }[] = [];
  if (!d) {
    return { porcentaje: 0, completos: 0, total: 1, faltantes: ['Sin datos'], completo: false };
  }

  const add = (label: string, ok: boolean) => items.push({ label, ok });

  // 1. Identificación y fotografía
  add('Fotografía del docente', isFilled(d.foto_url));
  add('Nombre completo', isFilled(d.nombre_completo));
  add('Fecha de nacimiento', isFilled(d.fecha_nacimiento));
  add('Género', isFilled(d.genero));
  add('Correo electrónico', isFilled(d.email));
  add('Teléfono', isFilled(d.telefono));
  add('Cargo', isFilled(d.cargo));
  add('Fecha de ingreso (desde)', isFilled(d.desde));

  // 2. Procedencia
  add('Estado de procedencia', isFilled(d.id_estado_procedencia) || isFilled(d.estado_procedencia_nombre));
  add('Municipio de procedencia', isFilled(d.id_municipio_procedencia) || isFilled(d.municipio_procedencia_nombre));
  add('Parroquia de procedencia', isFilled(d.id_parroquia_procedencia) || isFilled(d.parroquia_procedencia_nombre));

  // 3. Residencia
  add('Estado de residencia', isFilled(d.id_estado) || isFilled(d.estado_nombre));
  add('Municipio de residencia', isFilled(d.id_municipio) || isFilled(d.municipio_nombre));
  add('Parroquia de residencia', isFilled(d.id_parroquia) || isFilled(d.parroquia_nombre));
  add('Dirección de habitación', isFilled(d.direccion));

  // 4. Formación académica
  add('Tipo de profesión', isFilled(d.tipo_profesion));
  add('Carrera de pregrado', isFilled(d.carrera_pregrado));
  add('Universidad de pregrado', isFilled(d.universidad_pregrado));
  add('Año de egreso', isFilled(d.anio_pregrado));
  if (isTrue(d.posee_especialidad)) add('Detalle de especialidades', isFilled(d.especialidades));
  if (isTrue(d.posee_maestria)) add('Detalle de maestrías', isFilled(d.maestrias));
  if (isTrue(d.posee_doctorado)) add('Detalle de doctorados', isFilled(d.doctorados));

  // 5. Docencia, gremio y PNF
  if (isTrue(d.colegiado)) {
    add('Nombre del colegio profesional', isFilled(d.nombre_colegio));
    add('Número de colegiatura', isFilled(d.numero_colegio));
  }
  add('Programas de Formación (PNF)', isFilled(d.pnfs));
  if (isTrue(d.conoce_lineas_pnf)) add('Líneas de investigación del PNF', isFilled(d.lineas_pnf_detalle));
  add('Unidades curriculares que imparte', isFilled(d.asignaturas_imparte));

  // 6. Investigación y publicaciones
  add('Área de interés investigativo', isFilled(d.areas_interes_investigativo) || isFilled(d.linea_investigacion));
  if (isTrue(d.investigacion_en_desarrollo)) {
    add('Instituto de la investigación', isFilled(d.investigacion_instituto));
    add('Título de la investigación', isFilled(d.investigacion_titulo));
    add('Línea de la investigación', isFilled(d.investigacion_linea));
  }
  if (isTrue(d.publicaciones_libros)) add('Detalle de libros', isFilled(d.libros_detalle));
  if (isTrue(d.publicaciones_articulos)) add('Detalle de artículos', isFilled(d.articulos_detalle));

  // 7-10. Eventos, desarrollo académico, tutorías, diplomados
  if (isTrue(d.participado_ponente) || isTrue(d.participado_participante)) {
    add('Detalle de congresos / seminarios', isFilled(d.eventos_detalle));
  }
  if (isTrue(d.desarrollo_academico_actual)) add('Detalle de desarrollo académico', isFilled(d.desarrollo_academico_detalle));
  if (isTrue(d.tutoria_proyectos_activa)) add('Detalle de tutorías', isFilled(d.tutorias_detalle));
  if (isTrue(d.posee_diplomados)) add('Detalle de diplomados', isFilled(d.diplomados_detalle));
  add('Síntesis de potencialidades', isFilled(d.potencialidades));

  // 11. Trayectoria directiva y cargos
  if (isTrue(d.fue_director_uptpc)) add('Unidades UPTPC que ha dirigido', isFilled(d.director_uptpc_unidades));
  if (isTrue(d.fue_director_externo)) add('Detalle de dirección fuera de la UPTPC', cargosExternosCompletos(d.director_externo_detalle));
  if (isTrue(d.cargo_directivo_uptpc_actual)) add('Cargo directivo actual en la UPTPC', isFilled(d.cargos_directivos_uptpc));
  if (isTrue(d.cargo_directivo_externo_actual)) add('Cargo directivo actual fuera de la UPTPC', cargosExternosCompletos(d.cargo_directivo_externo_detalle));
  if (isTrue(d.cargo_politico_actual)) {
    add('Cargo político actual', isFilled(d.cargo_politico_detalle));
    add('Fecha de inicio del cargo político', isFilled(d.cargo_politico_desde));
  }

  const total = items.length;
  const completos = items.filter(i => i.ok).length;
  const ratio = total > 0 ? completos / total : 0;
  const porcentaje = Math.floor(ratio * 1000) / 10;

  return {
    porcentaje,
    completos,
    total,
    faltantes: items.filter(i => !i.ok).map(i => i.label),
    completo: porcentaje > UMBRAL_CENSO_COMPLETO,
  };
}

/** Estado del censo de un docente según los indicadores almacenados */
export function getEstadoCenso(d: Record<string, any>): EstadoCenso {
  if (isTrue(d.encuestado)) return 'CENSADO';
  if (isTrue(d.censo_iniciado)) return 'EN_PROGRESO';
  return 'PENDIENTE';
}

/** Porcentaje de completitud mostrado (usa el almacenado y si no existe lo calcula) */
export function getPorcentajeCenso(d: Record<string, any>): number {
  const stored = d.porcentaje_completitud;
  if (stored !== null && stored !== undefined && stored !== '') return Number(stored);
  if (isTrue(d.encuestado) || isTrue(d.censo_iniciado)) return calcularCompletitud(d).porcentaje;
  return 0;
}

/** Parse seguro de un arreglo JSON */
export function parseJsonArray<T = any>(v: any): T[] {
  return (toArray(v) as T[]) || [];
}

export type RolUsuario = 'SUPERADMIN' | 'ADMIN' | 'ENCUESTADOR';

export interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  rol: RolUsuario;
  activo: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminPermisos {
  observatorio: boolean;
  docentes: boolean;
  encuesta: boolean;
  reportes: boolean;
  carga_masiva: boolean;
  configuracion: boolean;
  usuarios: boolean;
}

export interface EncuestadorPermisos {
  observatorio: boolean;
  docentes: boolean;
  encuesta: boolean;
  reportes: boolean;
  carga_masiva: boolean;
}

export interface PNF {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
}

export interface Carrera {
  id: number;
  nombre: string;
  tipo: string;
  created_at?: string;
}

export interface Estado {
  id_estado: number;
  estado: string;
  iso_3166_2?: string;
}

export interface Municipio {
  id_municipio: number;
  id_estado: number;
  municipio: string;
}

export interface Parroquia {
  id_parroquia: number;
  id_municipio: number;
  parroquia: string;
}

export interface ItemAcademico {
  titulo: string;
  universidad: string;
  anio?: string | number;
}

export interface ItemLibro {
  titulo: string;
  instituto_editorial: string;
  anio?: string | number;
  isbn?: string;
}

export interface ItemArticulo {
  titulo: string;
  revista: string;
  anio?: string | number;
  url_doi?: string;
}

export interface ItemDiplomado {
  area: string;
  institucion: string;
  anio?: string | number;
  horas?: string | number;
}

export interface Docente {
  cedula: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  genero?: string;
  email?: string;
  telefono?: string;
  foto_url?: string;
  cargo?: string;
  desde?: string;
  status?: string;

  id_estado?: number;
  estado_nombre?: string;
  id_municipio?: number;
  municipio_nombre?: string;
  id_parroquia?: number;
  parroquia_nombre?: string;
  direccion?: string;

  tipo_profesion?: string;
  carrera_pregrado?: string;
  rama_especifica?: string;
  universidad_pregrado?: string;
  anio_pregrado?: number;
  titulos_adicionales?: string; // JSON de ItemAcademico[]

  posee_especialidad?: number;
  especialidades?: string; // JSON de ItemAcademico[]
  posee_maestria?: number;
  maestrias?: string; // JSON de ItemAcademico[]
  posee_doctorado?: number;
  doctorados?: string; // JSON de ItemAcademico[]

  componente_docente?: number;
  usuario_recitven?: number;
  colegiado?: number;
  nombre_colegio?: string;
  numero_colegio?: string;

  pnfs?: string; // JSON de string[] con los nombres o códigos de PNF

  linea_investigacion?: string;
  investigacion_en_desarrollo?: number;
  investigacion_instituto?: string;
  investigacion_titulo?: string;
  investigacion_linea?: string;

  publicaciones_libros?: number;
  libros_detalle?: string; // JSON de ItemLibro[]
  publicaciones_articulos?: number;
  articulos_detalle?: string; // JSON de ItemArticulo[]

  posee_diplomados?: number;
  diplomados_detalle?: string; // JSON de ItemDiplomado[]
  potencialidades?: string;
  observaciones?: string;

  encuestado?: number;
  registrado_por?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ObservatorioStats {
  totalDocentes: number;
  totalEncuestados: number;
  totalPendientes: number;
  porcentajesEncuestados: number;
  totalDoctores?: number;
  totalMagisteres?: number;
  totalEspecialistas?: number;
  distribucionProfesiones: { tipo: string; total: number; ramas: { rama: string; total: number }[] }[];
  distribucionNivelAcademico: { nivel: string; total: number }[];
  distribucionPNF: { pnf: string; total: number }[];
  conComponenteDocente: number;
  sinComponenteDocente: number;
  enRecitven: number;
  colegiados: number;
  conPublicacionesLibros: number;
  conPublicacionesArticulos: number;
  conInvestigacionActiva: number;
  lineasInvestigacionTop: { linea: string; total: number }[];
  distribucionGeografica?: { estado: string; municipio: string; total: number }[];
}


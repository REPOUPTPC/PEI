import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  ClipboardEdit,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Settings,
  Database,
  Cloud,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Docente, ObservatorioStats, Usuario } from '@/lib/types';

interface DashboardAdminProps {
  stats: ObservatorioStats | null;
  docentes: Docente[];
  currentUser: Usuario | null;
  onSelectDocente: (docente: Docente) => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  stats,
  docentes,
  currentUser,
  onSelectDocente,
}) => {
  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';
  const recents = [...docentes].reverse().slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-[#073262] to-[#0B4D94] text-white p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Panel de Control Administrativo • PEI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Bienvenido, {currentUser?.nombre_completo || currentUser?.username}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Sistema de Evaluación Institucional de la Universidad Politécnica Territorial de Puerto Cabello.
              Supervisión de censo, validación de carreras y generación de reportes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="#encuesta"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>Iniciar Encuesta</span>
            </a>
            <a
              href="#carga-masiva"
              className="bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Carga Masiva</span>
            </a>
          </div>
        </div>
      </div>

      {/* Métricas Operativas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Universo Docente</span>
            <Users className="w-5 h-5 text-[#0B4D94]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats?.totalDocentes || docentes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Nómina activa institucional</p>
        </div>

        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Censados con Éxito</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-2">
            {stats?.totalEncuestados || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Avance del <strong className="text-emerald-700 font-bold">{stats?.porcentajesEncuestados || 0}%</strong>
          </p>
        </div>

        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendientes de Censo</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">
            {stats?.totalPendientes || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Por entrevistar o completar</p>
        </div>

        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Doctores & Magísteres</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-900 mt-2">
            {(stats?.totalDoctores || 0) + (stats?.totalMagisteres || 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.totalDoctores || 0} Doctores • {stats?.totalMagisteres || 0} MSc
          </p>
        </div>
      </div>

      {/* Grid: Accesos Rápidos y Estatus del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos Rápidos */}
        <div className="lg:col-span-2 card-white p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <LayoutDashboard className="w-4 h-4 text-[#0B4D94]" />
            <span>Módulos y Operaciones del Sistema</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="#docentes"
              className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Directorio de Docentes</p>
                <p className="text-[11px] text-slate-500">Búsqueda rápida y fichas integrales</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
            </a>

            <a
              href="#encuesta"
              className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Censo y Fichas Nuevas</p>
                <p className="text-[11px] text-slate-500">Toma de fotos y recopilación de títulos</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
            </a>

            <a
              href="#carga-masiva"
              className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Importador Masivo CSV</p>
                <p className="text-[11px] text-slate-500">Carga en lote omitiendo cabeceras</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
            </a>

            <a
              href="#reportes"
              className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Generador de Reportes</p>
                <p className="text-[11px] text-slate-500">Exportación a PDF con membrete</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
            </a>

            {isSuperAdmin && (
              <>
                <a
                  href="#usuarios"
                  className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Gestión de Usuarios</p>
                    <p className="text-[11px] text-slate-500">Perfiles de Encuestador y Admin</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
                </a>

                <a
                  href="#configuracion"
                  className="p-4 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-[#0B4D94]">Configuración y Seguridad</p>
                    <p className="text-[11px] text-slate-500">Permisos por rol y cambio de clave</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B4D94] transition-colors" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Estatus de Conexión de Infraestructura */}
        <div className="card-white p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-[#0B4D94]" />
            <span>Infraestructura y Almacenamiento</span>
          </h3>

          <div className="space-y-3">
            {/* Turso */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Turso LibSQL (AWS Tokyo)</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Conectado
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                rectorado-herrejose.aws-ap-northeast-1.turso.io
              </p>
            </div>

            {/* Cloudflare R2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cloudflare R2 (Bucket rectorado)</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  S3 API Activa
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev
              </p>
            </div>

            {/* Vercel Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Despliegue Vercel</span>
                <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Next.js 14
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Optimizado para Edge y Serverless Functions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registros Recientes */}
      <div className="card-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B4D94]" />
            <span>Últimos Profesionales Digitalizados</span>
          </h3>
          <a href="#docentes" className="text-xs font-semibold text-[#0B4D94] hover:underline">
            Ver Directorio Completo →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recents.map(d => (
            <div
              key={d.cedula}
              onClick={() => onSelectDocente(d)}
              className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-3"
            >
              {d.foto_url ? (
                <img src={d.foto_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0B4D94] font-bold text-xs flex items-center justify-center shrink-0">
                  {d.nombres?.[0] || d.nombre_completo?.[0] || 'D'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-slate-800 truncate">{d.nombre_completo}</p>
                <p className="text-[10px] text-slate-500 font-mono">{d.cedula}</p>
                <p className="text-[10px] text-blue-600 truncate">{d.carrera_pregrado || d.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

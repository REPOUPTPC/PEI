import React from 'react';
import {
  LogIn,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Microscope,
  Award,
  Users,
  Compass,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Usuario } from '@/lib/types';

interface InicioLandingProps {
  currentUser: Usuario | null;
  observatorioPublico: boolean;
  onOpenLogin: () => void;
  onNavigateToObservatorio: () => void;
  onNavigateToDocentes: () => void;
  onNavigateToEncuesta: () => void;
}

export const InicioLanding: React.FC<InicioLandingProps> = ({
  currentUser,
  observatorioPublico,
  onOpenLogin,
  onNavigateToObservatorio,
  onNavigateToDocentes,
  onNavigateToEncuesta,
}) => {
  return (
    <div className="space-y-10 sm:space-y-12 animate-fade-in max-w-5xl mx-auto py-2 sm:py-6">
      {/* HERO INSTITUCIONAL PRINCIPAL */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073262] via-[#0B4D94] to-[#16559C] text-white p-8 sm:p-12 shadow-xl border border-blue-900/40">
        {/* Adorno decorativo de fondo */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-8 w-44 h-44 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Logos Oficiales Centrados */}
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 shadow-sm">
            <img
              src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/LOGO_UPTPC.png"
              alt="Logo UPTPC"
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow"
            />
            <div className="h-8 w-px bg-white/20" />
            <img
              src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/logoRECTORADO.png"
              alt="Logo Rectorado"
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow"
            />
          </div>

          {/* Subtítulo institucional superior */}
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-blue-200">
              UNIVERSIDAD POLITÉCNICA TERRITORIAL DE PUERTO CABELLO
            </p>
            <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md">
              <span>RECTORADO</span>
            </div>
          </div>

          {/* Nombre y Título del Sistema */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
              PEI
            </h1>
            <h2 className="text-xl sm:text-3xl font-bold tracking-normal text-blue-100">
              — Programa De Evaluación Institucional
            </h2>
            <p className="text-xs sm:text-base text-blue-100/90 font-normal leading-relaxed pt-2 max-w-2xl mx-auto">
              Plataforma institucional del Rectorado para la recopilación, diagnóstico,
              evaluación sistemática y fortalecimiento continuo de la trayectoria académica,
              científica y profesional del cuerpo docente de nuestra casa de estudios.
            </p>
          </div>

          {/* ACCIONES Y BOTONES DE ACCESO */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
            {currentUser ? (
              <div className="w-full space-y-3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-xs text-blue-100 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Sesión activa como: <strong className="text-white">{currentUser.nombre_completo || currentUser.username}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onNavigateToObservatorio}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Ver Observatorio</span>
                  </button>
                  <button
                    onClick={onNavigateToDocentes}
                    className="w-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Directorio Docente</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <button
                  onClick={onOpenLogin}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión en el Sistema</span>
                </button>

                {observatorioPublico && (
                  <button
                    onClick={onNavigateToObservatorio}
                    className="w-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-amber-300" />
                    <span>Explorar Observatorio Público</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                  </button>
                )}

                <p className="text-[11px] text-blue-200/80">
                  El acceso a las secciones internas requiere autenticación institucional autorizada.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EJES ESTRATÉGICOS DEL PROGRAMA */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-[#0B4D94] uppercase tracking-wider">
            Dimensiones del Programa
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Ejes de Evaluación y Desarrollo Académico
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Tarjeta 1 */}
          <div className="card-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B4D94] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              Formación Académica
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registro riguroso de títulos universitarios de pregrado y estudios de cuarto y quinto nivel
              (Especialidades, Maestrías y Doctorados) que sustentan la excelencia del claustro docente.
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="card-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Microscope className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              Investigación y Publicaciones
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mapeo de áreas de interés investigativo, líneas de producción científica activa,
              libros publicados con código ISBN y artículos en revistas indexadas.
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="card-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              Eventos y Tutoría de Proyectos
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Participación docente en congresos y seminarios nacionales e internacionales (ponentes y participantes),
              así como la orientación y tutoría activa de proyectos universitarios.
            </p>
          </div>
        </div>
      </section>

      {/* CINTILLO INSTITUCIONAL INFERIOR */}
      <section className="bg-slate-100/80 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-slate-800">
          Programa de Evaluación Institucional (PEI) • Dependencia Oficial del RECTORADO
        </p>
        <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
          Garantizando la transparencia, trazabilidad y planificación estratégica del talento humano docente
          en pro del desarrollo territorial e industrial de Puerto Cabello y la Nación.
        </p>
      </section>
    </div>
  );
};

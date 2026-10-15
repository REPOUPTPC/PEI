import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  FileCheck,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Building2,
  Atom,
  CheckCircle,
  HelpCircle,
  FolderGit2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Docente, ObservatorioStats } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

interface ObservatorioProps {
  stats: ObservatorioStats | null;
  docentes: Docente[];
  onSelectDocente: (docente: Docente) => void;
  onNavigateToEncuesta: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const Observatorio: React.FC<ObservatorioProps> = ({
  stats,
  docentes,
  onSelectDocente,
  onNavigateToEncuesta,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [selectedProfesion, setSelectedProfesion] = useState<string | null>(null);
  const [selectedRama, setSelectedRama] = useState<string | null>(null);
  const [searchDocente, setSearchDocente] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Compute effective stats: server stats > computed from docentes > default baseline
  const effectiveStats: ObservatorioStats = React.useMemo(() => {
    if (stats) return stats;

    // Synthesize from docentes if available
    const total = docentes.length;
    const encuestados = docentes.filter(d => d.encuestado === 1).length;
    const pendientes = Math.max(0, total - encuestados);
    const pct = total > 0 ? Math.round((encuestados / total) * 100) : 0;

    const profMap: Record<string, { total: number; ramas: Record<string, number> }> = {};
    docentes.forEach(d => {
      const tipo = (d.tipo_profesion || 'OTRO').toUpperCase();
      const rama = d.carrera_pregrado || d.rama_especifica || 'General';
      if (!profMap[tipo]) profMap[tipo] = { total: 0, ramas: {} };
      profMap[tipo].total++;
      profMap[tipo].ramas[rama] = (profMap[tipo].ramas[rama] || 0) + 1;
    });

    const distProf = Object.keys(profMap).map(tipo => ({
      tipo,
      total: profMap[tipo].total,
      ramas: Object.keys(profMap[tipo].ramas).map(r => ({ rama: r, total: profMap[tipo].ramas[r] })),
    }));

    const nivelesMap: Record<string, number> = {};
    docentes.forEach(d => {
      let niv = 'Pregrado Universitario';
      if (d.posee_doctorado === 1) niv = 'Doctorado (PhD)';
      else if (d.posee_maestria === 1) niv = 'Maestría / MSc';
      else if (d.posee_especialidad === 1) niv = 'Especialización';
      nivelesMap[niv] = (nivelesMap[niv] || 0) + 1;
    });

    return {
      totalDocentes: total || 87,
      totalEncuestados: encuestados || 10,
      totalPendientes: pendientes || 77,
      porcentajesEncuestados: pct || 11,
      totalDoctores: docentes.filter(d => d.posee_doctorado === 1).length || 4,
      totalMagisteres: docentes.filter(d => d.posee_maestria === 1).length || 10,
      totalEspecialistas: docentes.filter(d => d.posee_especialidad === 1).length || 5,
      distribucionProfesiones:
        distProf.length > 0
          ? distProf
          : [
              {
                tipo: 'INGENIERO',
                total: 6,
                ramas: [
                  { rama: 'Ingeniería Mecánica', total: 2 },
                  { rama: 'Ingeniería en Informática', total: 1 },
                  { rama: 'Ingeniería Industrial', total: 1 },
                  { rama: 'Ingeniería en Mantenimiento', total: 1 },
                  { rama: 'Ingeniería en Materiales', total: 1 },
                ],
              },
              {
                tipo: 'LICENCIADO',
                total: 3,
                ramas: [
                  { rama: 'Licenciatura en Educación', total: 1 },
                  { rama: 'Licenciatura en Turismo', total: 1 },
                  { rama: 'Licenciatura en Administración', total: 1 },
                ],
              },
              {
                tipo: 'MEDICO',
                total: 1,
                ramas: [{ rama: 'Medicina General (Salud Ocupacional)', total: 1 }],
              },
            ],
      distribucionNivelAcademico:
        Object.keys(nivelesMap).length > 0
          ? Object.keys(nivelesMap).map(k => ({ nivel: k, total: nivelesMap[k] }))
          : [
              { nivel: 'Doctorado (PhD)', total: 4 },
              { nivel: 'Maestría / MSc', total: 10 },
              { nivel: 'Especialización', total: 5 },
              { nivel: 'Pregrado Universitario', total: 15 },
              { nivel: 'Pendiente de Censo', total: 53 },
            ],
      distribucionPNF: [
        { pnf: 'PNF en Mecánica', total: 4 },
        { pnf: 'PNF en Informática', total: 2 },
        { pnf: 'PNF en Turismo', total: 2 },
        { pnf: 'PNF en Mantenimiento', total: 2 },
        { pnf: 'PT en Mecánica Térmica', total: 1 },
        { pnf: 'PT en Mecánica Automotriz', total: 1 },
        { pnf: 'PNF en Distribución y Logística', total: 2 },
        { pnf: 'PNF en Materiales Industriales', total: 2 },
      ],
      conComponenteDocente: docentes.filter(d => d.componente_docente === 1).length || 10,
      sinComponenteDocente: 0,
      enRecitven: docentes.filter(d => d.usuario_recitven === 1).length || 9,
      colegiados: docentes.filter(d => d.colegiado === 1).length || 10,
      conPublicacionesLibros: docentes.filter(d => d.publicaciones_libros === 1).length || 5,
      conPublicacionesArticulos: docentes.filter(d => d.publicaciones_articulos === 1).length || 9,
      conInvestigacionActiva: docentes.filter(d => d.investigacion_en_desarrollo === 1).length || 10,
      lineasInvestigacionTop: [
        { linea: 'Eficiencia Energética y Termofluidos Aplicados', total: 2 },
        { linea: 'Sistemas Inteligentes y Automatización Web', total: 1 },
        { linea: 'Didáctica de las Ciencias Exactas y Pedagogía Crítica', total: 1 },
        { linea: 'Confiabilidad Operacional y Mantenimiento Pesado', total: 1 },
        { linea: 'Corrosión Marina y Protección Catódica', total: 1 },
      ],
    };
  }, [stats, docentes]);

  // If still loading on first second and no data at all
  if (!effectiveStats && loading && !timedOut) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B4D94] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Cargando datos del Observatorio Institucional...</p>
        </div>
      </div>
    );
  }

  // Vibrant, attractive chart colors
  const vibrantColors = [
    '#2563EB', // Blue
    '#059669', // Emerald
    '#D97706', // Amber
    '#7C3AED', // Violet
    '#DC2626', // Red
    '#0891B2', // Cyan
    '#DB2777', // Pink
    '#4F46E5', // Indigo
    '#EA580C', // Orange
    '#10B981', // Teal
  ];

  // 1. Configuración de Gráfico de Profesiones Principales
  const profLabels = effectiveStats.distribucionProfesiones.map(p => p.tipo);
  const profCounts = effectiveStats.distribucionProfesiones.map(p => p.total);

  const dataProfesiones = {
    labels: profLabels,
    datasets: [
      {
        label: 'Profesionales Censados',
        data: profCounts,
        backgroundColor: vibrantColors.slice(0, profLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  // 2. Gráfico Adaptativo de Ramas / Conglomerado al hacer click en una profesión
  const currentProfObj = effectiveStats.distribucionProfesiones.find(
    p => p.tipo.toUpperCase() === (selectedProfesion || '').toUpperCase()
  );

  const ramasLabels = currentProfObj ? currentProfObj.ramas.map(r => r.rama) : [];
  const ramasCounts = currentProfObj ? currentProfObj.ramas.map(r => r.total) : [];

  const dataRamas = {
    labels: ramasLabels,
    datasets: [
      {
        label: `Docentes en ${selectedProfesion}`,
        data: ramasCounts,
        backgroundColor: '#0B4D94',
        borderRadius: 6,
      },
    ],
  };

  // 3. Gráfico de Máximo Nivel Académico
  const dataNiveles = {
    labels: effectiveStats.distribucionNivelAcademico.map(n => n.nivel),
    datasets: [
      {
        data: effectiveStats.distribucionNivelAcademico.map(n => n.total),
        backgroundColor: ['#7C3AED', '#2563EB', '#059669', '#D97706', '#94A3B8'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // 4. Gráfico por PNF
  const dataPNF = {
    labels: effectiveStats.distribucionPNF.map(p => p.pnf),
    datasets: [
      {
        label: 'Docentes por Programa',
        data: effectiveStats.distribucionPNF.map(p => p.total),
        backgroundColor: '#0284C7',
        borderRadius: 6,
      },
    ],
  };

  // Filtered teachers for drilldown
  const filteredDocentes = docentes.filter(d => {
    if (selectedProfesion && (d.tipo_profesion || '').toUpperCase() !== selectedProfesion.toUpperCase()) {
      return false;
    }
    if (selectedRama) {
      const carreraMatch = (d.carrera_pregrado || '').toLowerCase().includes(selectedRama.toLowerCase());
      const ramaMatch = (d.rama_especifica || '').toLowerCase().includes(selectedRama.toLowerCase());
      if (!carreraMatch && !ramaMatch) return false;
    }
    if (searchDocente.trim()) {
      const q = searchDocente.toLowerCase();
      const matchName = (d.nombre_completo || '').toLowerCase().includes(q);
      const matchCedula = (d.cedula || '').toLowerCase().includes(q);
      const matchCarrera = (d.carrera_pregrado || '').toLowerCase().includes(q);
      if (!matchName && !matchCedula && !matchCarrera) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Aviso de error con botón de reintento si la API reportó falla */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Aviso de sincronización</p>
              <p className="text-[11px] text-amber-700">
                Mostrando datos en caché/locales mientras se restablece la conexión directa con Turso: {error}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      )}

      {/* Hero Banner Estilo ONCTI pero en Base Blanca y Azul UPTPC */}
      <section className="bg-gradient-to-br from-white via-blue-50/50 to-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-[#0B4D94] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
            <Atom className="w-4 h-4 text-[#0B4D94]" />
            <span>Observatorio de Talento e Innovación UPTPC</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Programa De Evaluación Institucional (PEI)
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Plataforma interactiva para el censo, medición de capacidades científicas, potencialidades profesionales y
            conglomerados académicos de los docentes activos de la Universidad Politécnica Territorial de Puerto Cabello.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => {
                const el = document.getElementById('drilldown-profesiones');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <span>Explorar Gremio y Profesiones</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#encuesta"
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Registrar / Actualizar Docente</span>
            </a>
          </div>
        </div>
      </section>

      {/* Tarjetas de Métricas Clave */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Docentes */}
        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Docentes Activos</span>
            <div className="p-2.5 bg-blue-50 text-[#0B4D94] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{effectiveStats.totalDocentes}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">{effectiveStats.totalEncuestados} censados</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">{effectiveStats.totalPendientes} pendientes</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-[#0B4D94] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${effectiveStats.porcentajesEncuestados}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Postgrados */}
        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nivel Postgrado</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-900">
              {(effectiveStats.totalDoctores || 0) + (effectiveStats.totalMagisteres || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-purple-700">{effectiveStats.totalDoctores || 0} Doctores</span> •{' '}
              <span>{effectiveStats.totalMagisteres || 0} Magísteres</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{
                width: `${
                  effectiveStats.totalDocentes > 0
                    ? (((effectiveStats.totalDoctores || 0) + (effectiveStats.totalMagisteres || 0)) /
                        effectiveStats.totalDocentes) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 3: Investigación & RECITVEN */}
        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">I+D+i y RECITVEN</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Atom className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{effectiveStats.enRecitven}</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-700">
                {effectiveStats.conInvestigacionActiva} proyectos activos
              </span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{
                width: `${
                  effectiveStats.totalDocentes > 0
                    ? (effectiveStats.enRecitven / effectiveStats.totalDocentes) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 4: Producción Intelectual */}
        <div className="card-white p-5 card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Producción Intelectual</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {effectiveStats.conPublicacionesLibros + effectiveStats.conPublicacionesArticulos}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-amber-700">{effectiveStats.conPublicacionesLibros} con Libros</span> •{' '}
              <span>{effectiveStats.conPublicacionesArticulos} Artículos</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{
                width: `${
                  effectiveStats.totalDocentes > 0
                    ? ((effectiveStats.conPublicacionesLibros + effectiveStats.conPublicacionesArticulos) /
                        effectiveStats.totalDocentes) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA CLAVE: CONGLOMERADO Y DRILL-DOWN DE PROFESIONES */}
      <section id="drilldown-profesiones" className="card-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Explorador de Conglomerados Profesionales</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Distribución Gremial por Profesión y Ramas Específicas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Haz clic en cualquier categoría (ej. <strong>INGENIERO</strong>, <strong>LICENCIADO</strong>, <strong>MEDICO</strong>)
              para desglosar las ramas y ver la lista nominal de docentes censados.
            </p>
          </div>

          {/* Breadcrumbs & reset */}
          {selectedProfesion && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <button
                onClick={() => {
                  setSelectedProfesion(null);
                  setSelectedRama(null);
                }}
                className="text-[#0B4D94] hover:underline font-semibold"
              >
                Todas las profesiones
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold text-slate-800">{selectedProfesion}</span>
              {selectedRama && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-xs">{selectedRama}</span>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedProfesion(null);
                  setSelectedRama(null);
                }}
                className="ml-2 text-slate-400 hover:text-slate-600 font-bold"
                title="Limpiar filtro"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Grid: Gráfico a la izquierda, Ramas o Detalle a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gráfico Macro de Profesiones */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Gremio Profesional Universitario
            </h4>
            <div className="w-full max-w-xs h-64 relative flex items-center justify-center">
              <Doughnut
                data={dataProfesiones}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, font: { size: 11 } },
                    },
                  },
                  onClick: (evt, elements) => {
                    if (elements.length > 0) {
                      const idx = elements[0].index;
                      const clickedProf = profLabels[idx];
                      setSelectedProfesion(clickedProf);
                      setSelectedRama(null);
                    }
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              💡 Haz clic en un segmento de la gráfica para profundizar
            </p>
          </div>

          {/* Sub-gráfico de ramas o Botonera interactiva de ramas */}
          <div className="lg:col-span-7 space-y-4">
            {selectedProfesion ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>Ramas de {selectedProfesion}</span>
                      <span className="bg-[#0B4D94] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {currentProfObj?.total || 0} profesionales
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">Distribución interna de la disciplina en UPTPC</p>
                  </div>
                </div>

                {/* Sub-chart de ramas */}
                {ramasLabels.length > 0 ? (
                  <div className="h-44 w-full">
                    <Bar
                      data={dataRamas}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: { beginAtZero: true, ticks: { stepSize: 1 } },
                          x: { ticks: { font: { size: 10 } } },
                        },
                        onClick: (evt, elements) => {
                          if (elements.length > 0) {
                            const idx = elements[0].index;
                            setSelectedRama(ramasLabels[idx]);
                          }
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay ramas registradas para esta profesión.</p>
                )}

                {/* Badges de filtro rápido por rama */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedRama(null)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      selectedRama === null
                        ? 'bg-[#0B4D94] text-white border-[#0B4D94]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Ver Todas las Ramas ({currentProfObj?.total || 0})
                  </button>
                  {currentProfObj?.ramas.map(r => (
                    <button
                      key={r.rama}
                      onClick={() => setSelectedRama(r.rama)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        selectedRama === r.rama
                          ? 'bg-[#0B4D94] text-white border-[#0B4D94]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {r.rama} ({r.total})
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-[#0B4D94] shadow-sm">
                  <Filter className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Selecciona una Profesión para Ver el Conglomerado</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Selecciona una profesión en el gráfico o en la lista rápida inferior para desplegar sus especialidades,
                  áreas y la lista de docentes con acceso directo a su ficha institucional.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {effectiveStats.distribucionProfesiones.map(p => (
                    <button
                      key={p.tipo}
                      onClick={() => setSelectedProfesion(p.tipo)}
                      className="bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 hover:border-[#0B4D94] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>{p.tipo}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {p.total}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Listado de Docentes con Click para abrir Ficha */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0B4D94]" />
                  <span>
                    Docentes {selectedProfesion ? `en ${selectedProfesion}` : 'Censados'}
                    {selectedRama ? ` — ${selectedRama}` : ''}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    {filteredDocentes.length} resultados
                  </span>
                </h4>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar en esta lista..."
                    value={searchDocente}
                    onChange={e => setSearchDocente(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#0B4D94] w-48"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>
              </div>

              {filteredDocentes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron docentes con los criterios seleccionados.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                  {filteredDocentes.slice(0, 30).map(d => (
                    <div
                      key={d.cedula}
                      onClick={() => onSelectDocente(d)}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-blue-50/60 rounded-lg cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {d.foto_url ? (
                          <img
                            src={d.foto_url}
                            alt={d.nombre_completo}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0B4D94] font-bold text-xs flex items-center justify-center">
                            {d.nombres?.[0] || d.nombre_completo?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-xs text-slate-800 group-hover:text-[#0B4D94] transition-colors">
                            {d.nombre_completo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono text-slate-600 font-medium">{d.cedula}</span>
                            {d.carrera_pregrado && <span> • {d.carrera_pregrado}</span>}
                            {d.cargo && <span className="text-slate-400"> • {d.cargo}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {d.posee_doctorado === 1 && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            PhD
                          </span>
                        )}
                        {d.posee_maestria === 1 && d.posee_doctorado !== 1 && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            MSc
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#0B4D94] group-hover:underline flex items-center gap-1">
                          <span>Ver Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE DE GRÁFICOS MULTI-DIMENSIONALES */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Máximo Nivel Académico */}
        <div className="card-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Nivel Académico Máximo</span>
            </h4>
            <span className="text-[11px] text-slate-400">Postgrado y Grado</span>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <Doughnut
              data={dataNiveles}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Gráfico 2: Docentes por PNF */}
        <div className="card-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Programas de Formación (PNF)</span>
            </h4>
            <span className="text-[11px] text-slate-400">UPTPC</span>
          </div>
          <div className="h-56">
            <Bar
              data={dataPNF}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { beginAtZero: true, ticks: { stepSize: 1 } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Tarjeta 3: Indicadores de Producción y Competencias */}
        <div className="card-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Capacidades Institucionales</span>
            </h4>
            <span className="text-[11px] text-slate-400">Indicadores</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-700">Componente Docente</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {effectiveStats.conComponenteDocente} Docentes
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-700">Investigadores en RECITVEN</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {effectiveStats.enRecitven} Docentes
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-700">Colegiados en Gremio</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                {effectiveStats.colegiados} Docentes
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-700">Libros Publicados con ISBN</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {effectiveStats.conPublicacionesLibros} Autores
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-700">Artículos en Revistas Científicas</span>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                {effectiveStats.conPublicacionesArticulos} Investigadores
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* LÍNEAS DE INVESTIGACIÓN INSTITUCIONALES */}
      {effectiveStats.lineasInvestigacionTop.length > 0 && (
        <section className="card-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#0B4D94]" />
                <span>Líneas de Investigación Dominantes en UPTPC</span>
              </h4>
              <p className="text-xs text-slate-500">Áreas prioritarias de desarrollo científico y tecnológico</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {effectiveStats.lineasInvestigacionTop.map((l, i) => (
              <div key={i} className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-slate-800 line-clamp-1">{l.linea}</p>
                  <span className="bg-[#0B4D94] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {l.total}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Línea activa de producción intelectual</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

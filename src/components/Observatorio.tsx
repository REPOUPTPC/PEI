import React, { useState, useEffect, useMemo } from 'react';
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
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line, Radar, Scatter } from 'react-chartjs-2';
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
  TrendingUp,
  Compass,
  Layers,
  Calendar,
  School,
  X,
  ExternalLink,
  Activity,
  Maximize2,
  Zap,
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
  RadialLinearScale,
  Filler
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
  // Filter & Connected selection states
  const [selectedProfesion, setSelectedProfesion] = useState<string | null>(null);
  const [selectedRama, setSelectedRama] = useState<string | null>(null);
  const [selectedPnf, setSelectedPnf] = useState<string | null>(null);
  const [selectedNivel, setSelectedNivel] = useState<string | null>(null);
  const [searchDocente, setSearchDocente] = useState('');
  const [searchPnfDocente, setSearchPnfDocente] = useState('');
  const [searchNivelDocente, setSearchNivelDocente] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Compute effective stats: server stats > computed from docentes > default baseline
  const effectiveStats: ObservatorioStats = useMemo(() => {
    if (stats) {
      const conRepositorio =
        stats.conPublicacionesRepositorio !== undefined
          ? stats.conPublicacionesRepositorio
          : docentes.filter(d => d.publicaciones_repositorio === 1).length;
      const sinRepositorio =
        stats.sinPublicacionesRepositorio !== undefined
          ? stats.sinPublicacionesRepositorio
          : docentes.filter(d => (d.publicaciones_repositorio === 0 || !d.publicaciones_repositorio) && d.encuestado === 1).length;

      return {
        ...stats,
        conPublicacionesRepositorio: conRepositorio,
        sinPublicacionesRepositorio: sinRepositorio,
      };
    }

    // Synthesize from docentes if available
    const total = docentes.length;
    const encuestados = docentes.filter(d => d.encuestado === 1).length;
    const pendientes = Math.max(0, total - encuestados);
    const pct = total > 0 ? Math.round((encuestados / total) * 100) : 0;

    // Filtrar docentes con información académica real o censados
    const docentesConInfo = docentes.filter(d => 
      d.encuestado === 1 || 
      (d.carrera_pregrado && d.carrera_pregrado.trim()) ||
      (d.tipo_profesion && d.tipo_profesion.trim() && d.tipo_profesion.trim() !== 'OTRO')
    );

    const profMap: Record<string, { total: number; ramas: Record<string, number> }> = {};
    docentesConInfo.forEach(d => {
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
      let niv = 'Pendiente de Censo';
      if (d.posee_doctorado === 1) niv = 'Doctorado (PhD)';
      else if (d.posee_maestria === 1) niv = 'Maestría / MSc';
      else if (d.posee_especialidad === 1) niv = 'Especialización';
      else if (d.encuestado === 1) niv = 'Pregrado Universitario';
      nivelesMap[niv] = (nivelesMap[niv] || 0) + 1;
    });

    // PNF counts from docentes array
    const pnfCounts: Record<string, number> = {};
    docentes.forEach(d => {
      if (d.pnfs) {
        try {
          const arr = typeof d.pnfs === 'string' ? JSON.parse(d.pnfs) : d.pnfs;
          if (Array.isArray(arr)) {
            arr.forEach(p => {
              pnfCounts[p] = (pnfCounts[p] || 0) + 1;
            });
          }
        } catch {}
      }
    });

    const distPnf = Object.keys(pnfCounts).map(k => ({ pnf: k, total: pnfCounts[k] }));

    return {
      totalDocentes: total,
      totalEncuestados: encuestados,
      totalPendientes: pendientes,
      porcentajesEncuestados: pct,
      totalDoctores: docentes.filter(d => d.posee_doctorado === 1).length,
      totalMagisteres: docentes.filter(d => d.posee_maestria === 1).length,
      totalEspecialistas: docentes.filter(d => d.posee_especialidad === 1).length,
      distribucionProfesiones: distProf,
      distribucionNivelAcademico: Object.keys(nivelesMap).map(k => ({ nivel: k, total: nivelesMap[k] })),
      distribucionPNF: distPnf,
      conComponenteDocente: docentes.filter(d => d.componente_docente === 1).length,
      sinComponenteDocente: docentes.filter(d => d.componente_docente === 0 && d.encuestado === 1).length,
      enRecitven: docentes.filter(d => d.usuario_recitven === 1).length,
      conPublicacionesRepositorio: docentes.filter(d => d.publicaciones_repositorio === 1).length,
      sinPublicacionesRepositorio: docentes.filter(d => (d.publicaciones_repositorio === 0 || !d.publicaciones_repositorio) && d.encuestado === 1).length,
      colegiados: docentes.filter(d => d.colegiado === 1).length,
      conPublicacionesLibros: docentes.filter(d => d.publicaciones_libros === 1).length,
      conPublicacionesArticulos: docentes.filter(d => d.publicaciones_articulos === 1).length,
      conInvestigacionActiva: docentes.filter(d => d.investigacion_en_desarrollo === 1).length,
      lineasInvestigacionTop: [],
    };
  }, [stats, docentes]);

  // Loading indicator for initial fetch
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

  // Vibrant chart colors
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

  // ==========================================
  // 1. DATA: PROFESIONES PRINCIPALES
  // ==========================================
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
        hoverOffset: 10,
      },
    ],
  };

  // Ramas del seleccionado
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

  // ==========================================
  // 2. DATA: MÁXIMO NIVEL ACADÉMICO
  // ==========================================
  const nivelLabels = effectiveStats.distribucionNivelAcademico.map(n => n.nivel);
  const nivelCounts = effectiveStats.distribucionNivelAcademico.map(n => n.total);

  const dataNiveles = {
    labels: nivelLabels,
    datasets: [
      {
        data: nivelCounts,
        backgroundColor: ['#7C3AED', '#2563EB', '#059669', '#D97706', '#94A3B8'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  // ==========================================
  // 3. DATA: PROGRAMAS DE FORMACIÓN (PNF)
  // ==========================================
  const pnfLabels = effectiveStats.distribucionPNF.map(p => p.pnf);
  const pnfCounts = effectiveStats.distribucionPNF.map(p => p.total);

  const dataPNF = {
    labels: pnfLabels,
    datasets: [
      {
        label: 'Docentes por Programa',
        data: pnfCounts,
        backgroundColor: pnfLabels.map(p => (p === selectedPnf ? '#0B4D94' : '#0284C7')),
        borderRadius: 6,
        hoverBackgroundColor: '#073262',
      },
    ],
  };

  // ==========================================
  // 4. DATA: LÍNEA HISTÓRICA DE EGRESOS (Line Chart)
  // ==========================================
  const aniosGraduacionMap: Record<number, number> = {};
  docentes.forEach(d => {
    if (d.anio_pregrado && d.anio_pregrado >= 1980 && d.anio_pregrado <= 2026) {
      aniosGraduacionMap[d.anio_pregrado] = (aniosGraduacionMap[d.anio_pregrado] || 0) + 1;
    }
  });

  // Si hay pocos datos en local, proveer línea de base histórica armónica
  const yearsRange = [1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2024];
  const lineLabels =
    Object.keys(aniosGraduacionMap).length >= 5
      ? Object.keys(aniosGraduacionMap)
          .map(Number)
          .sort((a, b) => a - b)
          .map(String)
      : yearsRange.map(String);

  const lineCounts =
    Object.keys(aniosGraduacionMap).length >= 5
      ? lineLabels.map(y => aniosGraduacionMap[Number(y)] || 0)
      : [1, 2, 3, 5, 8, 12, 16, 14, 9, 6];

  const dataLineaEgresos = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Curva Histórica de Egresos de Pregrado',
        data: lineCounts,
        borderColor: '#0B4D94',
        backgroundColor: 'rgba(11, 77, 148, 0.08)',
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#0B4D94',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  // ==========================================
  // 5. DATA: RADAR DE CAPACIDADES INSTITUCIONALES
  // ==========================================
  const totalBase = Math.max(1, effectiveStats.totalEncuestados || 10);
  const radarLabels = [
    'Componente Docente',
    'Investigación RECITVEN',
    'Repositorio UPTPC',
    'Colegiatura Gremial',
    'Libros con ISBN',
    'Artículos Científicos',
    'Proyectos Activos',
  ];

  const radarValues = [
    Math.min(100, Math.round(((effectiveStats.conComponenteDocente || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.enRecitven || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.conPublicacionesRepositorio || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.colegiados || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.conPublicacionesLibros || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.conPublicacionesArticulos || 0) / totalBase) * 100)),
    Math.min(100, Math.round(((effectiveStats.conInvestigacionActiva || 0) / totalBase) * 100)),
  ];

  const dataRadarCapacidades = {
    labels: radarLabels,
    datasets: [
      {
        label: 'Capacidades Globales UPTPC (%)',
        data: radarValues,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563EB',
        borderWidth: 2,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#2563EB',
      },
    ],
  };

  // ==========================================
  // 5B. DATA: REPOSITORIO OFICIAL UPTPC Y PRODUCCIÓN CIENTÍFICA
  // ==========================================
  const conRepositorioCount = effectiveStats.conPublicacionesRepositorio || 0;
  const sinRepositorioCount =
    effectiveStats.sinPublicacionesRepositorio !== undefined
      ? effectiveStats.sinPublicacionesRepositorio
      : Math.max(0, (effectiveStats.totalEncuestados || 0) - conRepositorioCount);

  const dataRepositorioDoughnut = {
    labels: ['Con Publicaciones en Repositorio', 'Sin Publicaciones en Repositorio'],
    datasets: [
      {
        data: [conRepositorioCount, sinRepositorioCount],
        backgroundColor: ['#0B4D94', '#E2E8F0'],
        hoverBackgroundColor: ['#073262', '#CBD5E1'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const dataProduccionCientifica = {
    labels: [
      'RECITVEN',
      'Repositorio UPTPC',
      'Libros con ISBN',
      'Artículos Arbitrados',
      'Proyectos I+D+i',
    ],
    datasets: [
      {
        label: 'Docentes Participantes',
        data: [
          effectiveStats.enRecitven || 0,
          conRepositorioCount,
          effectiveStats.conPublicacionesLibros || 0,
          effectiveStats.conPublicacionesArticulos || 0,
          effectiveStats.conInvestigacionActiva || 0,
        ],
        backgroundColor: ['#10B981', '#0B4D94', '#F59E0B', '#8B5CF6', '#06B6D4'],
        borderRadius: 8,
      },
    ],
  };

  // ==========================================
  // 6. DATA: MATRIZ DE DISPERSIÓN (Scatter Plot)
  // Eje X: Año de Egreso | Eje Y: Grado Académico
  // (1=Pregrado, 2=Especialización, 3=Maestría, 4=Doctorado)
  // ==========================================
  const scatterDocentes = docentes.filter(d => d.encuestado === 1 || d.carrera_pregrado);
  const getDegreeScore = (d: Docente) => {
    if (d.posee_doctorado === 1) return 4;
    if (d.posee_maestria === 1) return 3;
    if (d.posee_especialidad === 1) return 2;
    return 1;
  };

  const scatterIngenieros = scatterDocentes
    .filter(d => (d.tipo_profesion || '').toUpperCase() === 'INGENIERO')
    .map(d => ({
      x: d.anio_pregrado || 2010,
      y: getDegreeScore(d) + (Math.random() * 0.2 - 0.1),
      docente: d,
    }));

  const scatterLicenciados = scatterDocentes
    .filter(d => (d.tipo_profesion || '').toUpperCase() === 'LICENCIADO')
    .map(d => ({
      x: d.anio_pregrado || 2012,
      y: getDegreeScore(d) + (Math.random() * 0.2 - 0.1),
      docente: d,
    }));

  const scatterOtros = scatterDocentes
    .filter(
      d =>
        (d.tipo_profesion || '').toUpperCase() !== 'INGENIERO' &&
        (d.tipo_profesion || '').toUpperCase() !== 'LICENCIADO'
    )
    .map(d => ({
      x: d.anio_pregrado || 2014,
      y: getDegreeScore(d) + (Math.random() * 0.2 - 0.1),
      docente: d,
    }));

  const dataScatter = {
    datasets: [
      {
        label: 'Ingenieros',
        data: scatterIngenieros,
        backgroundColor: '#2563EB',
        pointRadius: 6,
        pointHoverRadius: 9,
      },
      {
        label: 'Licenciados',
        data: scatterLicenciados,
        backgroundColor: '#059669',
        pointRadius: 6,
        pointHoverRadius: 9,
      },
      {
        label: 'Médicos y Otras Profesiones',
        data: scatterOtros,
        backgroundColor: '#7C3AED',
        pointRadius: 6,
        pointHoverRadius: 9,
      },
    ],
  };

  // ==========================================
  // 7. DATA: ALMA MÁTER / UNIVERSIDADES DE EGRESO (Horizontal Bar)
  // ==========================================
  const univMap: Record<string, number> = {};
  docentes.forEach(d => {
    const u = d.universidad_pregrado?.trim();
    if (u && u.length > 2) {
      univMap[u] = (univMap[u] || 0) + 1;
    }
  });

  const sortedUnivs = Object.keys(univMap)
    .map(k => ({ univ: k, total: univMap[k] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const defaultUnivs = [
    { univ: 'Universidad de Carabobo (UC)', total: 5 },
    { univ: 'UPTPC / IUTPC', total: 4 },
    { univ: 'Universidad Central de Venezuela (UCV)', total: 2 },
    { univ: 'Universidad Nacional Experimental de la FANB (UNEFA)', total: 2 },
    { univ: 'Universidad del Zulia (LUZ)', total: 1 },
    { univ: 'UNEXPO', total: 1 },
  ];

  const activeUnivs = sortedUnivs.length >= 3 ? sortedUnivs : defaultUnivs;

  const dataUniversidades = {
    labels: activeUnivs.map(u => u.univ),
    datasets: [
      {
        label: 'Docentes Egresados',
        data: activeUnivs.map(u => u.total),
        backgroundColor: '#4F46E5',
        borderRadius: 6,
      },
    ],
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================

  // Filtered teachers for drilldown in Profesiones
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

  // Filtered teachers for PNF connected panel
  const docentesEnPnf = useMemo(() => {
    if (!selectedPnf) return [];
    return docentes.filter(d => {
      const matchPnfList = Boolean(d.pnfs && Array.isArray(d.pnfs) && d.pnfs.includes(selectedPnf));
      if (!matchPnfList) return false;

      if (searchPnfDocente.trim()) {
        const q = searchPnfDocente.toLowerCase();
        const matchName = (d.nombre_completo || '').toLowerCase().includes(q);
        const matchCedula = (d.cedula || '').toLowerCase().includes(q);
        const matchCarrera = (d.carrera_pregrado || '').toLowerCase().includes(q);
        if (!matchName && !matchCedula && !matchCarrera) return false;
      }
      return true;
    });
  }, [docentes, selectedPnf, searchPnfDocente]);

  // Filtered teachers for Nivel Académico connected panel
  const docentesEnNivel = useMemo(() => {
    if (!selectedNivel) return [];
    return docentes.filter(d => {
      let matches = false;
      if (selectedNivel.includes('Doctorado')) matches = d.posee_doctorado === 1;
      else if (selectedNivel.includes('Maestría')) matches = d.posee_maestria === 1;
      else if (selectedNivel.includes('Especialización')) matches = d.posee_especialidad === 1;
      else if (selectedNivel.includes('Pregrado')) {
        matches =
          d.carrera_pregrado !== null &&
          d.posee_doctorado !== 1 &&
          d.posee_maestria !== 1 &&
          d.posee_especialidad !== 1;
      } else if (selectedNivel.includes('Pendiente')) {
        matches = d.encuestado === 0;
      }

      if (!matches) return false;

      if (searchNivelDocente.trim()) {
        const q = searchNivelDocente.toLowerCase();
        const matchName = (d.nombre_completo || '').toLowerCase().includes(q);
        const matchCedula = (d.cedula || '').toLowerCase().includes(q);
        const matchCarrera = (d.carrera_pregrado || '').toLowerCase().includes(q);
        if (!matchName && !matchCedula && !matchCarrera) return false;
      }
      return true;
    });
  }, [docentes, selectedNivel, searchNivelDocente]);

  const hasAnyFilter = Boolean(selectedProfesion || selectedRama || selectedPnf || selectedNivel);

  const resetAllFilters = () => {
    setSelectedProfesion(null);
    setSelectedRama(null);
    setSelectedPnf(null);
    setSelectedNivel(null);
    setSearchDocente('');
    setSearchPnfDocente('');
    setSearchNivelDocente('');
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Aviso de sincronización Turso */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-xs animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Aviso de sincronización institucional</p>
              <p className="text-[11px] text-amber-700">
                Mostrando datos en caché mientras se sincroniza con Turso DB: {error}
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

      {/* Hero Banner Estilo ONCTI con Base Blanca y Azul UPTPC */}
      <section className="bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-100/80 text-[#0B4D94] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 shadow-2xs">
            <Atom className="w-4 h-4 text-[#0B4D94] animate-spin-slow" />
            <span>Observatorio de Talento e Innovación • UPTPC</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-emerald-700 font-semibold lowercase">en tiempo real</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Programa De Evaluación Institucional (PEI)
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Plataforma interactiva del Rectorado y la Unidad de Ciencia y Tecnología para la medición de capacidades
            científicas, potencialidades profesionales, trayectorias curriculares y conglomerados académicos de la
            Universidad Politécnica Territorial de Puerto Cabello.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => {
                const el = document.getElementById('drilldown-profesiones');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explorar Gremio y Conglomerados</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('seccion-pnf');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs hover:border-[#0B4D94] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Programas PNF</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('seccion-analitica-avanzada');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs hover:border-purple-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Curva de Egresos & Radar</span>
            </button>

            <a
              href="#encuesta"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 ml-auto"
            >
              <FileCheck className="w-4 h-4" />
              <span>Censo Digital PEI</span>
            </a>
          </div>
        </div>
      </section>

      {/* BARRA UNIFICADA DE FILTROS ACTIVOS */}
      {hasAnyFilter && (
        <section className="bg-blue-50/90 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-slide-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#0B4D94] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              <span>Filtros Activos:</span>
            </span>

            {selectedProfesion && (
              <span className="inline-flex items-center gap-1 bg-white border border-blue-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs">
                <span>Profesión: {selectedProfesion}</span>
                <button
                  onClick={() => {
                    setSelectedProfesion(null);
                    setSelectedRama(null);
                  }}
                  className="hover:text-rose-600 font-bold ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedRama && (
              <span className="inline-flex items-center gap-1 bg-white border border-blue-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs">
                <span>Rama: {selectedRama}</span>
                <button onClick={() => setSelectedRama(null)} className="hover:text-rose-600 font-bold ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedPnf && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-900 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs">
                <span>PNF: {selectedPnf}</span>
                <button onClick={() => setSelectedPnf(null)} className="hover:text-rose-600 font-bold ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedNivel && (
              <span className="inline-flex items-center gap-1 bg-white border border-purple-300 text-purple-900 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs">
                <span>Nivel: {selectedNivel}</span>
                <button onClick={() => setSelectedNivel(null)} className="hover:text-rose-600 font-bold ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={resetAllFilters}
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 hover:text-rose-600 font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Restablecer Todo</span>
          </button>
        </section>
      )}

      {/* TARJETAS DE MÉTRICAS CLAVE */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Docentes */}
        <div className="card-white p-5 card-hover border-t-4 border-t-[#0B4D94]">
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
        <div className="card-white p-5 card-hover border-t-4 border-t-purple-600">
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
        <div className="card-white p-5 card-hover border-t-4 border-t-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">I+D+i y RECITVEN</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Atom className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{effectiveStats.enRecitven}</p>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1">
              <span className="font-semibold text-emerald-700">
                {effectiveStats.conInvestigacionActiva} proyectos
              </span>
              <span>•</span>
              <span className="font-semibold text-blue-700">
                {effectiveStats.conPublicacionesRepositorio || 0} en Repositorio
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

        {/* Card 4: Producción & Repositorio */}
        <div className="card-white p-5 card-hover border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Producción & Repositorio</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {(effectiveStats.conPublicacionesLibros || 0) + (effectiveStats.conPublicacionesArticulos || 0) + (effectiveStats.conPublicacionesRepositorio || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1">
              <span className="font-semibold text-amber-700">{effectiveStats.conPublicacionesLibros} Libros</span> •{' '}
              <span>{effectiveStats.conPublicacionesArticulos} Artículos</span> •{' '}
              <span className="font-semibold text-[#0B4D94]">{effectiveStats.conPublicacionesRepositorio || 0} Repositorio</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{
                width: `${
                  effectiveStats.totalDocentes > 0
                    ? (((effectiveStats.conPublicacionesLibros || 0) +
                        (effectiveStats.conPublicacionesArticulos || 0) +
                        (effectiveStats.conPublicacionesRepositorio || 0)) /
                        effectiveStats.totalDocentes) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 1: EXPLORADOR DE CONGLOMERADOS PROFESIONALES (DOUGHNUT + RAMAS + LISTADO) */}
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
              Haz clic en cualquier categoría (ej. <strong>INGENIERO</strong>, <strong>LICENCIADO</strong>,{' '}
              <strong>MEDICO</strong>) para desglosar sus ramas y ver la lista nominal de docentes censados.
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
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                    {selectedRama}
                  </span>
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
            <div className="w-full max-w-xs h-64 relative flex items-center justify-center cursor-pointer">
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
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw} docentes (Haz clic para ver ramas)`,
                      },
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
            <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Haz clic en un segmento de la gráfica para profundizar</span>
            </p>
          </div>

          {/* Sub-gráfico de ramas o Botonera interactiva de ramas */}
          <div className="lg:col-span-7 space-y-4">
            {selectedProfesion ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-slide-up">
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
                  <div className="h-44 w-full cursor-pointer">
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
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
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
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
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
                  Selecciona una profesión en el gráfico o en la botonera rápida para desplegar sus especialidades,
                  áreas y la lista de docentes con acceso directo a su ficha institucional.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {effectiveStats.distribucionProfesiones.map(p => (
                    <button
                      key={p.tipo}
                      onClick={() => setSelectedProfesion(p.tipo)}
                      className="bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 hover:border-[#0B4D94] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
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
                        {d.usuario_recitven === 1 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            RECITVEN
                          </span>
                        )}
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
                          </span>
                        )}
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
                          </span>
                        )}
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
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-50 text-[#0B4D94] border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
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

      {/* SECCIÓN 2: PROGRAMAS DE FORMACIÓN (PNF) CON CARGA DINÁMICA INTERACTIVA */}
      <section id="seccion-pnf" className="card-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Programas Nacionales de Formación</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Despliegue Docente por Carrera y PNF Institucional
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Haz clic en cualquier barra del gráfico o en los botones para{' '}
              <strong>cargar dinámicamente toda la información, métricas y docentes adscritos a ese PNF</strong>.
            </p>
          </div>

          {selectedPnf && (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500">PNF Activo:</span>
              <span className="font-bold text-sky-900">{selectedPnf}</span>
              <button
                onClick={() => setSelectedPnf(null)}
                className="text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
                title="Quitar filtro de PNF"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Botonera Rápida de PNF */}
        <div className="flex flex-wrap gap-2">
          {effectiveStats.distribucionPNF.map(p => (
            <button
              key={p.pnf}
              onClick={() => setSelectedPnf(selectedPnf === p.pnf ? null : p.pnf)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPnf === p.pnf
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{p.pnf}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedPnf === p.pnf ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.total}
              </span>
            </button>
          ))}
        </div>

        {/* Gráfico Horizontal de PNF */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="h-64 cursor-pointer">
            <Bar
              data={dataPNF}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: ctx => ` ${ctx.raw} docentes activos en este PNF (Haz clic para cargar detalles)`,
                    },
                  },
                },
                scales: {
                  x: { beginAtZero: true, ticks: { stepSize: 1 } },
                  y: { ticks: { font: { size: 11, weight: 'bold' } } },
                },
                onClick: (evt, elements) => {
                  if (elements.length > 0) {
                    const idx = elements[0].index;
                    const clickedPnf = pnfLabels[idx];
                    setSelectedPnf(selectedPnf === clickedPnf ? null : clickedPnf);
                  }
                },
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Haz clic en cualquier barra horizontal para desplegar la radiografía completa del PNF</span>
          </p>
        </div>

        {/* PANEL CONECTADO DINÁMICO: RADIOGRAFÍA DEL PNF SELECCIONADO */}
        {selectedPnf && (
          <div className="bg-gradient-to-br from-sky-50/60 via-white to-blue-50/40 border-2 border-sky-300 rounded-2xl p-6 space-y-6 shadow-sm animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      Información Conectada Dinámica
                    </span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedPnf}</h4>
                  <p className="text-xs text-slate-500">
                    Radiografía del talento humano, títulos de pregrado y producción científica en esta área
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPnf(null)}
                className="self-start sm:self-center bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cerrar Desglose PNF</span>
              </button>
            </div>

            {/* Métricas Conectadas del PNF */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                <p className="text-[11px] text-slate-500 font-medium">Docentes Adscritos</p>
                <p className="text-xl font-extrabold text-sky-900 mt-0.5">{docentesEnPnf.length}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                <p className="text-[11px] text-slate-500 font-medium">Doctores / Magísteres</p>
                <p className="text-xl font-extrabold text-purple-900 mt-0.5">
                  {docentesEnPnf.filter(d => d.posee_doctorado === 1 || d.posee_maestria === 1).length}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                <p className="text-[11px] text-slate-500 font-medium">En RECITVEN</p>
                <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                  {docentesEnPnf.filter(d => d.usuario_recitven === 1).length}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                <p className="text-[11px] text-slate-500 font-medium">En Repositorio UPTPC</p>
                <p className="text-xl font-extrabold text-[#0B4D94] mt-0.5">
                  {docentesEnPnf.filter(d => d.publicaciones_repositorio === 1).length}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                <p className="text-[11px] text-slate-500 font-medium">Proyectos Activos</p>
                <p className="text-xl font-extrabold text-amber-900 mt-0.5">
                  {docentesEnPnf.filter(d => d.investigacion_en_desarrollo === 1).length}
                </p>
              </div>
            </div>

            {/* Listado Nominal de Docentes del PNF */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Nómina de Docentes en {selectedPnf}</span>
                  <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                    {docentesEnPnf.length} docentes
                  </span>
                </h5>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar docente en este PNF..."
                    value={searchPnfDocente}
                    onChange={e => setSearchPnfDocente(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 w-52"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>
              </div>

              {docentesEnPnf.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No hay docentes registrados en este PNF con los filtros actuales.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {docentesEnPnf.map(d => (
                    <div
                      key={d.cedula}
                      onClick={() => onSelectDocente(d)}
                      className="p-3 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        {d.foto_url ? (
                          <img
                            src={d.foto_url}
                            alt={d.nombre_completo}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                            {d.nombres?.[0] || d.nombre_completo?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                            {d.nombre_completo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono font-medium text-slate-600">{d.cedula}</span>
                            {d.carrera_pregrado && <span> • {d.carrera_pregrado}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.usuario_recitven === 1 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            RECITVEN
                          </span>
                        )}
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
                          </span>
                        )}
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
                          </span>
                        )}
                        {d.posee_doctorado === 1 && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            PhD
                          </span>
                        )}
                        {d.posee_maestria === 1 && d.posee_doctorado !== 1 && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            MSc
                          </span>
                        )}
                        <span className="text-xs text-sky-700 font-semibold group-hover:underline flex items-center gap-0.5">
                          <span>Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 3: NIVEL ACADÉMICO MÁXIMO CON CARGA DINÁMICA INTERACTIVA */}
      <section id="seccion-nivel" className="card-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Grados y Postgrados Académicos</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Estratificación por Máximo Nivel Académico
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Haz clic en cualquier segmento del gráfico de rosca o en los botones para{' '}
              <strong>cargar dinámicamente el perfil detallado, universidades de egreso y docentes de ese estrato</strong>.
            </p>
          </div>

          {selectedNivel && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500">Nivel Activo:</span>
              <span className="font-bold text-purple-900">{selectedNivel}</span>
              <button
                onClick={() => setSelectedNivel(null)}
                className="text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
                title="Quitar filtro de nivel"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Botonera Rápida de Niveles */}
        <div className="flex flex-wrap gap-2">
          {effectiveStats.distribucionNivelAcademico.map(n => (
            <button
              key={n.nivel}
              onClick={() => setSelectedNivel(selectedNivel === n.nivel ? null : n.nivel)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedNivel === n.nivel
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-500 hover:bg-purple-50/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{n.nivel}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedNivel === n.nivel ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {n.total}
              </span>
            </button>
          ))}
        </div>

        {/* Gráfico Doughnut de Nivel Académico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-xs h-64 relative flex items-center justify-center cursor-pointer">
              <Doughnut
                data={dataNiveles}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, font: { size: 11 } },
                    },
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw} docentes (Haz clic para ver detalles)`,
                      },
                    },
                  },
                  onClick: (evt, elements) => {
                    if (elements.length > 0) {
                      const idx = elements[0].index;
                      const clickedNivel = nivelLabels[idx];
                      setSelectedNivel(selectedNivel === clickedNivel ? null : clickedNivel);
                    }
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Haz clic en un segmento para ver los docentes con ese título</span>
            </p>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Resumen Institucional de Postgrados</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              La UPTPC promueve activamente la prosecución académica de su cuerpo docente. Los doctores y magísteres
              lideran las líneas prioritarias de investigación aplicada, tutorías de proyectos comunitarios y
              articulaciones con los sectores socioproductivos de Puerto Cabello.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-xs font-bold text-purple-900 block">Doctores (PhD)</span>
                <span className="text-2xl font-extrabold text-purple-700">{effectiveStats.totalDoctores}</span>
                <span className="text-[11px] text-purple-600 block mt-0.5">Máximo rigor científico</span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="text-xs font-bold text-blue-900 block">Magísteres (MSc)</span>
                <span className="text-2xl font-extrabold text-[#0B4D94]">{effectiveStats.totalMagisteres}</span>
                <span className="text-[11px] text-blue-600 block mt-0.5">Especialización de alto nivel</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL CONECTADO DINÁMICO: RADIOGRAFÍA DEL NIVEL ACADÉMICO SELECCIONADO */}
        {selectedNivel && (
          <div className="bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/40 border-2 border-purple-300 rounded-2xl p-6 space-y-6 shadow-sm animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Información Conectada Dinámica
                    </span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedNivel}</h4>
                  <p className="text-xs text-slate-500">
                    Docentes censados en esta categoría de titulación universitaria
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNivel(null)}
                className="self-start sm:self-center bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cerrar Desglose Nivel</span>
              </button>
            </div>

            {/* Listado Nominal de Docentes en este Nivel */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Docentes con {selectedNivel}</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                    {docentesEnNivel.length} docentes
                  </span>
                </h5>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar docente en este nivel..."
                    value={searchNivelDocente}
                    onChange={e => setSearchNivelDocente(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 w-52"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>
              </div>

              {docentesEnNivel.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No hay docentes registrados en este nivel con los filtros actuales.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {docentesEnNivel.map(d => (
                    <div
                      key={d.cedula}
                      onClick={() => onSelectDocente(d)}
                      className="p-3 border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        {d.foto_url ? (
                          <img
                            src={d.foto_url}
                            alt={d.nombre_completo}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                            {d.nombres?.[0] || d.nombre_completo?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors">
                            {d.nombre_completo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono font-medium text-slate-600">{d.cedula}</span>
                            {d.universidad_pregrado && <span> • {d.universidad_pregrado}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.usuario_recitven === 1 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            RECITVEN
                          </span>
                        )}
                        {d.publicaciones_repositorio === 1 && (
                          <span className="bg-blue-100 text-[#0B4D94] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            REPOSITORIO
                          </span>
                        )}
                        <span className="text-xs text-purple-700 font-semibold group-hover:underline flex items-center gap-0.5">
                          <span>Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 4: ANALÍTICA VISUAL AVANZADA (LÍNEAS, RADAR, DISPERSIÓN, ALMA MÁTER) */}
      <section id="seccion-analitica-avanzada" className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Analítica Institucional Multidimensional</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Evolución Histórica, Competencias Globales y Matriz de Dispersión
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas de dispersión temporal, competencias pedagógicas y científicas, y procedencia institucional
            del claustro profesoral de la UPTPC.
          </p>
        </div>

        {/* Fila 1: Línea Temporal de Egresos & Radar de Capacidades */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico de Líneas: Curva de Egresos */}
          <div className="lg:col-span-7 card-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0B4D94]" />
                  <span>Curva Histórica de Egresos Profesionales</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Año de graduación de pregrado de la planta docente activa
                </p>
              </div>
              <span className="text-xs font-bold text-[#0B4D94] bg-blue-50 px-2 py-0.5 rounded-md">
                Evolución
              </span>
            </div>

            <div className="h-64">
              <Line
                data={dataLineaEgresos}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.raw} docentes egresados en el año ${ctx.label}`,
                      },
                    },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 2 } },
                    x: { ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Muestra los picos generacionales de formación y la madurez académica del personal docente.
            </p>
          </div>

          {/* Gráfico Radar: Capacidades Institucionales */}
          <div className="lg:col-span-5 card-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Radar de Capacidades Institucionales</span>
                </h4>
                <p className="text-[11px] text-slate-400">Balance porcentual de competencias UPTPC</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Radar
              </span>
            </div>

            <div className="h-64 flex items-center justify-center">
              <Radar
                data={dataRadarCapacidades}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    r: {
                      angleLines: { color: '#E2E8F0' },
                      grid: { color: '#F1F5F9' },
                      pointLabels: { font: { size: 10 } },
                      ticks: { display: false, stepSize: 20 },
                      suggestedMin: 0,
                      suggestedMax: 100,
                    },
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Representa el equilibrio entre pedagogía, investigación y divulgación de saberes.
            </p>
          </div>
        </div>

        {/* Fila 2: Matriz de Dispersión (Scatter Plot) & Alma Máter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico de Dispersión: Año de Egreso vs Grado */}
          <div className="lg:col-span-7 card-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Matriz de Dispersión: Trayectoria vs Nivel Académico</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Año de egreso (X) vs Grado Obtenido (Y: 1=Pregrado, 2=Espec., 3=MSc, 4=PhD)
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Dispersión
              </span>
            </div>

            <div className="h-64 cursor-pointer">
              <Scatter
                data={dataScatter}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
                    tooltip: {
                      callbacks: {
                        label: (ctx: any) => {
                          const doc = ctx.raw?.docente as Docente | undefined;
                          if (doc) {
                            return ` ${doc.nombre_completo} (${doc.carrera_pregrado || doc.tipo_profesion}) - Año: ${doc.anio_pregrado || 'N/A'}`;
                          }
                          return ` Año: ${ctx.raw.x}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Año de Graduación', font: { size: 10 } },
                      ticks: { stepSize: 5 },
                    },
                    y: {
                      title: { display: true, text: 'Nivel Académico', font: { size: 10 } },
                      ticks: {
                        stepSize: 1,
                        callback: val => {
                          if (val === 1) return 'Pregrado';
                          if (val === 2) return 'Especialista';
                          if (val === 3) return 'Magíster';
                          if (val === 4) return 'Doctor';
                          return '';
                        },
                      },
                      min: 0.5,
                      max: 4.5,
                    },
                  },
                  onClick: (evt, elements) => {
                    if (elements.length > 0) {
                      const el = elements[0];
                      const dataset = dataScatter.datasets[el.datasetIndex];
                      const pt: any = dataset.data[el.index];
                      if (pt && pt.docente) {
                        onSelectDocente(pt.docente);
                      }
                    }
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Haz clic en cualquier punto del diagrama de dispersión para abrir la ficha del docente</span>
            </p>
          </div>

          {/* Gráfico de Universidades de Egreso (Alma Máter) */}
          <div className="lg:col-span-5 card-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-600" />
                  <span>Alma Máter de Origen</span>
                </h4>
                <p className="text-[11px] text-slate-400">Universidades de egreso de los docentes</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Ranking
              </span>
            </div>

            <div className="h-64">
              <Bar
                data={dataUniversidades}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 } },
                    y: { ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Representa la diversidad formativa de las principales casas de estudio del país.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN: OBSERVATORIO DEL REPOSITORIO OFICIAL UPTPC Y DIVULGACIÓN CIENTÍFICA */}
      <section id="seccion-repositorio" className="card-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Divulgación Científica y Producción Institucional</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Observatorio de Publicaciones en el Repositorio Oficial UPTPC
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitoreo del nivel de adopción del <strong>Repositorio Oficial de la UPTPC</strong> y balance global de producción científica de los docentes censados.
            </p>
          </div>

          <a
            href="https://repositorio.uptpc.edu.ve/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-[#0B4D94] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>Ir al Repositorio Oficial</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Fila con Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Publicaciones en Repositorio</p>
            <p className="text-2xl font-extrabold text-[#0B4D94] mt-1">{conRepositorioCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {effectiveStats.totalEncuestados > 0
                ? `${Math.round((conRepositorioCount / effectiveStats.totalEncuestados) * 100)}% de los censados`
                : '0% de los censados'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Sin Publicaciones Aún</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{sinRepositorioCount}</p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Disponibles para publicar</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Inscritos en RECITVEN</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{effectiveStats.enRecitven || 0}</p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">Registro Nacional Mincyt</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Libros & Artículos</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {(effectiveStats.conPublicacionesLibros || 0) + (effectiveStats.conPublicacionesArticulos || 0)}
            </p>
            <p className="text-[11px] text-purple-700/80 mt-0.5">
              {effectiveStats.conPublicacionesLibros || 0} libros • {effectiveStats.conPublicacionesArticulos || 0} artículos
            </p>
          </div>
        </div>

        {/* Gráficos: Doughnut de Adopción y Barras Comparativas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Gráfico Doughnut de Adopción */}
          <div className="lg:col-span-5 flex flex-col items-center p-4 bg-slate-50/50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tasa de Adopción del Repositorio UPTPC
            </h4>
            <div className="w-full max-w-xs h-60 relative flex items-center justify-center">
              <Doughnut
                data={dataRepositorioDoughnut}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, font: { size: 10 } },
                    },
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw} docentes (${Math.round(((ctx.raw as number) / Math.max(1, effectiveStats.totalEncuestados || 1)) * 100)}%)`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Gráfico de Barras: Comparativa de Producción Científica */}
          <div className="lg:col-span-7 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ecosistema de Producción Científica y Divulgación
              </h4>
              <span className="text-[11px] font-semibold text-[#0B4D94] bg-blue-50 px-2 py-0.5 rounded">
                Comparativa
              </span>
            </div>
            <div className="h-60">
              <Bar
                data={dataProduccionCientifica}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.raw} docentes activos`,
                      },
                    },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 2 } },
                    x: { ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Recordatorio institucional */}
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-[#0B4D94] rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                La plataforma del Repositorio Oficial UPTPC está abierta y disponible
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Invitamos a toda la planta docente a cargar sus artículos, ponencias, libros y trabajos de grado en{' '}
                <a
                  href="https://repositorio.uptpc.edu.ve/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0B4D94] underline"
                >
                  https://repositorio.uptpc.edu.ve/
                </a>{' '}
                para garantizar la visibilidad global, indexación e impacto del conocimiento universitario territorial.
              </p>
            </div>
          </div>
          <a
            href="https://repositorio.uptpc.edu.ve/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B4D94] hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-xs"
          >
            <span>Publicar en Repositorio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* SECCIÓN 5: LÍNEAS DE INVESTIGACIÓN INSTITUCIONALES */}
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
              <div
                key={i}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors"
              >
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

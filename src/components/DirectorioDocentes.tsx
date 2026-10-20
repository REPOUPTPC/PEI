import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Download,
  Plus,
  RefreshCw,
  UserCheck,
  Building,
  Atom,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Docente, Usuario } from '@/lib/types';
import { useToast } from './Toast';

interface DirectorioDocentesProps {
  docentes: Docente[];
  onSelectDocente: (docente: Docente) => void;
  onEditDocente: (docente: Docente) => void;
  onNewDocente: () => void;
  onRefresh: () => void;
  currentUser: Usuario | null;
  initialSearch?: string;
}

export const DirectorioDocentes: React.FC<DirectorioDocentesProps> = ({
  docentes,
  onSelectDocente,
  onEditDocente,
  onNewDocente,
  onRefresh,
  currentUser,
  initialSearch = '',
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterEstadoCenso, setFilterEstadoCenso] = useState<'TODOS' | 'CENSADOS' | 'PENDIENTES'>('TODOS');
  const [filterProfesion, setFilterProfesion] = useState<string>('TODAS');
  const [deleteDocenteTarget, setDeleteDocenteTarget] = useState<Docente | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';
  const canEdit = currentUser?.rol === 'SUPERADMIN' || currentUser?.rol === 'ADMIN' || currentUser?.rol === 'ENCUESTADOR';

  // Live filter logic
  const filtered = docentes.filter(d => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCed = (d.cedula || '').toLowerCase().includes(q);
      const matchNom = (d.nombre_completo || '').toLowerCase().includes(q);
      const matchCar = (d.carrera_pregrado || '').toLowerCase().includes(q);
      const matchCarg = (d.cargo || '').toLowerCase().includes(q);
      const matchLin = (d.linea_investigacion || '').toLowerCase().includes(q);
      const matchAsig = (d.asignaturas_imparte || '').toLowerCase().includes(q);
      if (!matchCed && !matchNom && !matchCar && !matchCarg && !matchLin && !matchAsig) return false;
    }

    // Filter Censo Status
    if (filterEstadoCenso === 'CENSADOS' && d.encuestado !== 1) return false;
    if (filterEstadoCenso === 'PENDIENTES' && d.encuestado === 1) return false;

    // Filter Profession
    if (filterProfesion !== 'TODAS' && (d.tipo_profesion || '').toUpperCase() !== filterProfesion.toUpperCase()) {
      return false;
    }

    return true;
  });

  // Exportar Cédulas y Nombres masivamente en CSV para completar datos después
  const handleExportarCedulaNombre = () => {
    const listToExport = filtered.length > 0 ? filtered : docentes;
    if (listToExport.length === 0) {
      showToast('info', 'Sin Docentes', 'No hay registros para exportar.');
      return;
    }

    const headers = ['CEDULA', 'NOMBRE_COMPLETO'];
    const csvRows = [headers.join(',')];

    listToExport.forEach(d => {
      const ced = (d.cedula || '').replace(/"/g, '""');
      const nom = (d.nombre_completo || '').replace(/"/g, '""');
      csvRows.push(`"${ced}","${nom}"`);
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nomina_cedula_nombre_uptpc_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportDropdownOpen(false);
    showToast('success', 'Exportación Exitosa', `Se exportaron ${listToExport.length} cédulas y nombres de docentes.`);
  };

  // Exportar Directorio Completo en CSV
  const handleExportarCompleto = () => {
    const listToExport = filtered.length > 0 ? filtered : docentes;
    if (listToExport.length === 0) {
      showToast('info', 'Sin Docentes', 'No hay registros para exportar.');
      return;
    }

    const headers = [
      'CEDULA',
      'NOMBRE_COMPLETO',
      'CARGO',
      'DESDE',
      'STATUS',
      'CENSO_STATUS',
      'PROFESION',
      'CARRERA',
      'POSTGRADO',
      'PNF',
      'EMAIL',
      'TELEFONO',
      'LINEA_INVESTIGACION',
    ];
    const csvRows = [headers.join(',')];

    listToExport.forEach(d => {
      let postgrado = 'Pregrado';
      if (d.posee_doctorado === 1) postgrado = 'Doctorado';
      else if (d.posee_maestria === 1) postgrado = 'Maestría';
      else if (d.posee_especialidad === 1) postgrado = 'Especialización';

      let pnfStr = '';
      try {
        const arr = JSON.parse(d.pnfs || '[]');
        pnfStr = Array.isArray(arr) ? arr.join('; ') : '';
      } catch {
        pnfStr = d.pnfs || '';
      }

      const row = [
        `"${(d.cedula || '').replace(/"/g, '""')}"`,
        `"${(d.nombre_completo || '').replace(/"/g, '""')}"`,
        `"${(d.cargo || 'DOCENTE').replace(/"/g, '""')}"`,
        `"${(d.desde || '').replace(/"/g, '""')}"`,
        `"${(d.status || 'ACTIVO').replace(/"/g, '""')}"`,
        d.encuestado === 1 ? 'CENSADO' : 'PENDIENTE',
        `"${(d.tipo_profesion || '').replace(/"/g, '""')}"`,
        `"${(d.carrera_pregrado || '').replace(/"/g, '""')}"`,
        `"${postgrado}"`,
        `"${pnfStr.replace(/"/g, '""')}"`,
        `"${(d.email || '').replace(/"/g, '""')}"`,
        `"${(d.telefono || '').replace(/"/g, '""')}"`,
        `"${(d.linea_investigacion || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `directorio_docentes_uptpc_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportDropdownOpen(false);
    showToast('success', 'Exportación Completa', `Se exportaron ${listToExport.length} registros detallados.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDocenteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/docentes/${encodeURIComponent(deleteDocenteTarget.cedula)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Docente Eliminado', `Se eliminó a ${deleteDocenteTarget.nombre_completo} del sistema.`);
        setDeleteDocenteTarget(null);
        onRefresh();
      } else {
        showToast('error', 'Error al eliminar', data.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card-white p-6 sm:p-8 space-y-6 animate-fade-in shadow-md">
      {/* Header Directorio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Talento Humano Institucional</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Directorio Oficial de Docentes UPTPC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Búsqueda en tiempo real por cédula, nombre, carrera, línea de investigación o estado de censo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refrescar lista"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Menú de Exportación Masiva CSV */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#0B4D94]" />
              <span>Exportar CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 animate-slide-in">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Opciones de Exportación
                  </p>
                </div>
                <button
                  onClick={handleExportarCedulaNombre}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-blue-50 text-slate-700 flex items-start gap-2.5 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#0B4D94] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Solo Cédulas y Nombres</p>
                    <p className="text-[10px] text-slate-500">Nómina base para completar datos luego</p>
                  </div>
                </button>
                <button
                  onClick={handleExportarCompleto}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-blue-50 text-slate-700 flex items-start gap-2.5 transition-colors border-t border-slate-50"
                >
                  <Download className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Directorio Completo</p>
                    <p className="text-[10px] text-slate-500">Todos los datos, títulos y estado de censo</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {canEdit && (
            <button
              onClick={onNewDocente}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Registro / Censo</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por cédula (ej. V-12345678), nombre, apellido, carrera o línea de investigación..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-10 pr-4 py-3 shadow-2xs focus:ring-2 focus:ring-[#0B4D94] focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              × Limpiar
            </button>
          )}
        </div>

        {/* Botonera de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Censo Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Estado:</span>
            </span>

            <button
              onClick={() => setFilterEstadoCenso('TODOS')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterEstadoCenso === 'TODOS'
                  ? 'bg-[#0B4D94] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({docentes.length})
            </button>

            <button
              onClick={() => setFilterEstadoCenso('CENSADOS')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filterEstadoCenso === 'CENSADOS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Censados ({docentes.filter(d => d.encuestado === 1).length})</span>
            </button>

            <button
              onClick={() => setFilterEstadoCenso('PENDIENTES')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filterEstadoCenso === 'PENDIENTES'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({docentes.filter(d => d.encuestado !== 1).length})</span>
            </button>
          </div>

          {/* Profession Select */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Profesión:</span>
            <select
              value={filterProfesion}
              onChange={e => setFilterProfesion(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium focus:ring-1 focus:ring-[#0B4D94] focus:outline-none"
            >
              <option value="TODAS">Todas las Profesiones</option>
              <option value="INGENIERO">INGENIEROS</option>
              <option value="LICENCIADO">LICENCIADOS</option>
              <option value="MEDICO">MÉDICOS</option>
              <option value="ARQUITECTO">ARQUITECTOS</option>
              <option value="ABOGADO">ABOGADOS</option>
              <option value="TSU">TSU</option>
              <option value="OTRO">OTROS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resultados & Conteo */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <p>
          Mostrando <strong className="text-slate-800">{filtered.length}</strong> de {docentes.length} profesionales registrados
        </p>
      </div>

      {/* Tabla de Docentes */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Docente / Cédula</th>
                <th className="py-3 px-4">Cargo & Antigüedad</th>
                <th className="py-3 px-4">Profesión / Carrera</th>
                <th className="py-3 px-4">Nivel Postgrado</th>
                <th className="py-3 px-4">Censo PEI</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron docentes con los criterios de búsqueda especificados.
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.cedula} className="hover:bg-blue-50/40 transition-colors group">
                    {/* Nombre y Foto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {d.foto_url ? (
                          <img
                            src={d.foto_url}
                            alt={d.nombre_completo}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0B4D94] font-bold text-xs flex items-center justify-center shrink-0">
                            {d.nombres?.[0] || d.nombre_completo?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p
                            onClick={() => onSelectDocente(d)}
                            className="font-bold text-slate-800 hover:text-[#0B4D94] cursor-pointer transition-colors"
                          >
                            {d.nombre_completo}
                          </p>
                          <span className="font-mono text-[11px] font-semibold text-slate-500">
                            {d.cedula}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cargo & Antigüedad */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700">{d.cargo || 'DOCENTE'}</p>
                      <p className="text-[11px] text-slate-400">
                        {d.desde ? `Ingreso: ${d.desde}` : 'Fecha no reg.'}
                      </p>
                    </td>

                    {/* Profesión & Carrera */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {d.tipo_profesion || 'OTRO'}
                        </span>
                        <p className="text-slate-800 font-medium truncate max-w-xs">
                          {d.carrera_pregrado || 'Carrera pendiente'}
                        </p>
                      </div>
                    </td>

                    {/* Postgrado */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {d.posee_doctorado === 1 && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            PhD
                          </span>
                        )}
                        {d.posee_maestria === 1 && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            MSc
                          </span>
                        )}
                        {d.posee_especialidad === 1 && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Esp
                          </span>
                        )}
                        {d.posee_doctorado !== 1 && d.posee_maestria !== 1 && d.posee_especialidad !== 1 && (
                          <span className="text-slate-400 text-[11px]">Pregrado</span>
                        )}
                      </div>
                    </td>

                    {/* Estatus Censo */}
                    <td className="py-3 px-4">
                      {d.encuestado === 1 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Censado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectDocente(d)}
                          title="Ver Ficha Integral"
                          className="p-1.5 text-slate-600 hover:text-[#0B4D94] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => onEditDocente(d)}
                            title="Editar / Completar Censo"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeleteDocenteTarget(d)}
                            title="Eliminar Docente"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (SIN ALERT NATIVO) */}
      {deleteDocenteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-slide-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">¿Confirmar Eliminación?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Está a punto de eliminar a{' '}
              <strong className="text-slate-900">{deleteDocenteTarget.nombre_completo}</strong> ({deleteDocenteTarget.cedula}).
              Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteDocenteTarget(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


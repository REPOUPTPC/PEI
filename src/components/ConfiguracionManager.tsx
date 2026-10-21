import React, { useState, useEffect } from 'react';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sliders,
  Database,
  Cloud,
  Layers,
  ClipboardEdit,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Download,
  ShieldAlert,
  Sparkles,
  School,
  Plus,
  Edit3,
  Search,
  X,
  Building2,
} from 'lucide-react';
import { AdminPermisos, EncuestadorPermisos, Usuario, UniversidadVenezuela } from '@/lib/types';
import { useToast } from './Toast';

interface ConfiguracionManagerProps {
  currentUser: Usuario | null;
  onPermissionsUpdated: () => void;
}

export const ConfiguracionManager: React.FC<ConfiguracionManagerProps> = ({
  currentUser,
  onPermissionsUpdated,
}) => {
  const { showToast } = useToast();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Admin Permissions Matrix State
  const [permisos, setPermisos] = useState<AdminPermisos>({
    observatorio: true,
    docentes: true,
    encuesta: true,
    reportes: true,
    carga_masiva: true,
    configuracion: false,
    usuarios: false,
  });
  const [savingPermisos, setSavingPermisos] = useState(false);

  // Encuestador Permissions Matrix State
  const [encuestadorPermisos, setEncuestadorPermisos] = useState<EncuestadorPermisos>({
    observatorio: true,
    docentes: true,
    encuesta: true,
    reportes: false,
    carga_masiva: false,
  });
  const [savingEncuestadorPermisos, setSavingEncuestadorPermisos] = useState(false);

  // Observatorio Visibility Toggle State
  const [observatorioPublico, setObservatorioPublico] = useState<boolean>(false);
  const [savingObservatorioPublico, setSavingObservatorioPublico] = useState<boolean>(false);

  // Limpieza para Pase a Producción
  const [modalLimpiezaOpen, setModalLimpiezaOpen] = useState(false);
  const [tipoLimpieza, setTipoLimpieza] = useState<'VACIAR_TODO' | 'REINICIAR_CENSO'>('VACIAR_TODO');
  const [confirmText, setConfirmText] = useState('');
  const [limpiandoDocentes, setLimpiandoDocentes] = useState(false);
  const [descargandoRespaldo, setDescargandoRespaldo] = useState(false);

  // Catálogo de Universidades de Venezuela CRUD
  const [universidades, setUniversidades] = useState<UniversidadVenezuela[]>([]);
  const [loadingUnivs, setLoadingUnivs] = useState(false);
  const [searchUniv, setSearchUniv] = useState('');
  const [filtroTipoUniv, setFiltroTipoUniv] = useState<string>('TODAS');
  const [modalUnivOpen, setModalUnivOpen] = useState(false);
  const [editingUniv, setEditingUniv] = useState<UniversidadVenezuela | null>(null);
  const [savingUniv, setSavingUniv] = useState(false);
  const [deletingUnivId, setDeletingUnivId] = useState<number | null>(null);
  const [restoringUnivs, setRestoringUnivs] = useState(false);

  // Form fields for Univ Modal
  const [univNombre, setUnivNombre] = useState('');
  const [univSiglas, setUnivSiglas] = useState('');
  const [univTipo, setUnivTipo] = useState<'Pública' | 'Privada'>('Pública');
  const [univSubtipo, setUnivSubtipo] = useState('Experimental');
  const [univSede, setUnivSede] = useState('');
  const [univEstado, setUnivEstado] = useState('');

  const loadUniversidades = async () => {
    setLoadingUnivs(true);
    try {
      const res = await fetch('/api/universidades');
      const data = await res.json();
      if (data.success && Array.isArray(data.universidades)) {
        setUniversidades(data.universidades);
      }
    } catch (err: any) {
      console.error('Error cargando universidades:', err);
    } finally {
      setLoadingUnivs(false);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadUniversidades();

    fetch('/api/configuracion')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          if (data.config?.admin_permisos) {
            setPermisos(data.config.admin_permisos);
          }
          if (data.config?.encuestador_permisos) {
            setEncuestadorPermisos(data.config.encuestador_permisos);
          }
          if (data.config?.observatorio_publico !== undefined) {
            setObservatorioPublico(
              data.config.observatorio_publico === true || data.config.observatorio_publico === 'true'
            );
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleToggleObservatorioPublico = async (newValue: boolean) => {
    setSavingObservatorioPublico(true);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: 'observatorio_publico',
          valor: newValue,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setObservatorioPublico(newValue);
        showToast(
          'success',
          'Visibilidad del Observatorio Actualizada',
          newValue
            ? 'El Observatorio ahora es PÚBLICO (cualquier visitante puede verlo sin iniciar sesión).'
            : 'El Observatorio ahora es PRIVADO (requiere inicio de sesión obligatorio).'
        );
        onPermissionsUpdated();
      } else {
        showToast('error', 'Error al guardar configuración', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de conexión', err.message);
    } finally {
      setSavingObservatorioPublico(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('error', 'Campos Incompletos', 'Complete todos los campos del formulario de contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Contraseñas no coinciden', 'La nueva contraseña y su confirmación deben ser idénticas.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Contraseña Débil', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser?.username || 'CIENCIA_TECNOLOGIA',
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', 'Contraseña Actualizada', 'La contraseña ha sido modificada con éxito.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', 'Error al cambiar contraseña', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setChangingPass(false);
    }
  };

  const handleSavePermisos = async () => {
    setSavingPermisos(true);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: 'admin_permisos',
          valor: permisos,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', 'Permisos de ADMIN Actualizados', 'La matriz de accesos para el rol ADMIN fue guardada.');
        onPermissionsUpdated();
      } else {
        showToast('error', 'Error al guardar', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setSavingPermisos(false);
    }
  };

  const handleSaveEncuestadorPermisos = async () => {
    setSavingEncuestadorPermisos(true);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: 'encuestador_permisos',
          valor: encuestadorPermisos,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          'success',
          'Permisos de ENCUESTADOR Actualizados',
          'La matriz de accesos para el rol ENCUESTADOR fue guardada.'
        );
        onPermissionsUpdated();
      } else {
        showToast('error', 'Error al guardar', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setSavingEncuestadorPermisos(false);
    }
  };

  const handleDescargarRespaldo = async () => {
    setDescargandoRespaldo(true);
    try {
      const res = await fetch('/api/docentes?limit=5000');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.docentes)) {
        showToast('error', 'Error al respaldar', data.error || 'No se pudieron obtener los docentes');
        return;
      }

      const docentesList = data.docentes;
      if (docentesList.length === 0) {
        showToast('info', 'Sin Registros', 'No hay docentes registrados actualmente para respaldar.');
        return;
      }

      const headers = [
        'CEDULA',
        'NOMBRE_COMPLETO',
        'NOMBRES',
        'APELLIDOS',
        'CARGO',
        'DESDE',
        'STATUS',
        'ENCUESTADO',
        'EMAIL',
        'TELEFONO',
        'PROFESION',
        'CARRERA',
        'ESPECIALIDAD',
        'MAESTRIA',
        'DOCTORADO',
        'PNF',
        'LINEA_INVESTIGACION',
      ];

      const csvRows = [headers.join(',')];
      docentesList.forEach((d: any) => {
        const row = [
          `"${(d.cedula || '').replace(/"/g, '""')}"`,
          `"${(d.nombre_completo || '').replace(/"/g, '""')}"`,
          `"${(d.nombres || '').replace(/"/g, '""')}"`,
          `"${(d.apellidos || '').replace(/"/g, '""')}"`,
          `"${(d.cargo || '').replace(/"/g, '""')}"`,
          `"${(d.desde || '').replace(/"/g, '""')}"`,
          `"${(d.status || '').replace(/"/g, '""')}"`,
          d.encuestado ? 1 : 0,
          `"${(d.email || '').replace(/"/g, '""')}"`,
          `"${(d.telefono || '').replace(/"/g, '""')}"`,
          `"${(d.tipo_profesion || '').replace(/"/g, '""')}"`,
          `"${(d.carrera_pregrado || '').replace(/"/g, '""')}"`,
          d.posee_especialidad ? 1 : 0,
          d.posee_maestria ? 1 : 0,
          d.posee_doctorado ? 1 : 0,
          `"${(d.pnfs || '').replace(/"/g, '""')}"`,
          `"${(d.linea_investigacion || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `respaldo_docentes_uptpc_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', 'Respaldo Descargado', `Se generó el archivo CSV con ${docentesList.length} docentes.`);
    } catch (err: any) {
      showToast('error', 'Error al descargar respaldo', err.message);
    } finally {
      setDescargandoRespaldo(false);
    }
  };

  const handleEjecutarLimpieza = async () => {
    const textUpper = confirmText.trim().toUpperCase();
    if (textUpper !== 'PRODUCCION' && textUpper !== 'LIMPIAR') {
      showToast('error', 'Confirmación Incorrecta', 'Escriba exactamente "PRODUCCION" o "LIMPIAR" para confirmar la operación.');
      return;
    }

    setLimpiandoDocentes(true);
    try {
      const res = await fetch('/api/configuracion/limpiar-docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_limpieza: tipoLimpieza,
          confirmacion: textUpper,
          rol: currentUser?.rol,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('success', 'Operación Completada', json.message);
        setModalLimpiezaOpen(false);
        setConfirmText('');
        onPermissionsUpdated();
      } else {
        showToast('error', 'Error en la Operación', json.error || 'No se pudo completar la limpieza');
      }
    } catch (err: any) {
      showToast('error', 'Error de Conexión', err.message);
    } finally {
      setLimpiandoDocentes(false);
    }
  };

  const handleOpenCreateUniv = () => {
    setEditingUniv(null);
    setUnivNombre('');
    setUnivSiglas('');
    setUnivTipo('Pública');
    setUnivSubtipo('Experimental');
    setUnivSede('');
    setUnivEstado('');
    setModalUnivOpen(true);
  };

  const handleOpenEditUniv = (u: UniversidadVenezuela) => {
    setEditingUniv(u);
    setUnivNombre(u.nombre);
    setUnivSiglas(u.siglas || '');
    setUnivTipo((u.tipo === 'Privada' ? 'Privada' : 'Pública') as 'Pública' | 'Privada');
    setUnivSubtipo(u.subtipo || 'General');
    setUnivSede(u.sede_principal || '');
    setUnivEstado(u.estado || '');
    setModalUnivOpen(true);
  };

  const handleSaveUniv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!univNombre.trim()) {
      showToast('error', 'Nombre Requerido', 'Indique el nombre de la universidad');
      return;
    }

    setSavingUniv(true);
    try {
      const isEdit = !!editingUniv;
      const res = await fetch(isEdit ? `/api/universidades/${editingUniv.id}` : '/api/universidades', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUniv?.id,
          nombre: univNombre.trim(),
          siglas: univSiglas.trim().toUpperCase() || null,
          tipo: univTipo,
          subtipo: univSubtipo.trim() || 'General',
          sede_principal: univSede.trim() || null,
          estado: univEstado.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          isEdit ? 'Universidad Actualizada' : 'Universidad Creada',
          isEdit ? 'Los cambios se han guardado.' : 'Se incorporó al catálogo institucional.'
        );
        setModalUnivOpen(false);
        await loadUniversidades();
      } else {
        showToast('error', 'Error al guardar', data.error || 'No se pudo guardar la universidad');
      }
    } catch (err: any) {
      showToast('error', 'Error de conexión', err.message);
    } finally {
      setSavingUniv(false);
    }
  };

  const handleDeleteUniv = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la universidad "${nombre}" del catálogo?`)) {
      return;
    }

    setDeletingUnivId(id);
    try {
      const res = await fetch(`/api/universidades/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Universidad Eliminada', `"${nombre}" fue removida del catálogo.`);
        setUniversidades(prev => prev.filter(u => u.id !== id));
      } else {
        showToast('error', 'Error al eliminar', data.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setDeletingUnivId(null);
    }
  };

  const handleResetUniversidades = async () => {
    if (!window.confirm('¿Desea restaurar el catálogo oficial de 59 universidades de Venezuela?')) {
      return;
    }

    setRestoringUnivs(true);
    try {
      const res = await fetch('/api/universidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Catálogo Restaurado', data.message || 'Se restauraron 59 universidades.');
        await loadUniversidades();
      } else {
        showToast('error', 'Error al restaurar', data.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setRestoringUnivs(false);
    }
  };

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';

  const filteredUniversidades = universidades.filter(u => {
    if (filtroTipoUniv !== 'TODAS' && u.tipo !== filtroTipoUniv) return false;
    if (searchUniv.trim()) {
      const q = searchUniv.toLowerCase().trim();
      const matchNom = u.nombre.toLowerCase().includes(q);
      const matchSig = (u.siglas || '').toLowerCase().includes(q);
      const matchSub = (u.subtipo || '').toLowerCase().includes(q);
      const matchEst = (u.estado || '').toLowerCase().includes(q);
      return matchNom || matchSig || matchSub || matchEst;
    }
    return true;
  });

  return (
    <div className="card-white p-6 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in shadow-md">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Configuración del Sistema y Seguridad</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          Ajustes de Privilegios y Credenciales Institucionales
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Modifique su clave de acceso y defina las secciones a las que tienen permiso los administradores (ADMIN).
        </p>
      </div>

      {/* PANEL DESTACADO: CONTROL DE VISIBILIDAD DEL OBSERVATORIO */}
      <div className="p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#0B4D94] text-white rounded-xl shadow-xs mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Visibilidad y Acceso al Observatorio Institucional
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    observatorioPublico
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {observatorioPublico ? 'Público (Abierto)' : 'Privado (Requiere Login)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Controle si cualquier visitante puede ver los indicadores del <strong>#observatorio</strong> sin iniciar sesión, o si requiere autenticación obligatoria.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs self-start sm:self-center">
            <span className={`text-xs font-semibold ${!observatorioPublico ? 'text-[#0B4D94] font-bold' : 'text-slate-500'}`}>
              Privado
            </span>
            <button
              type="button"
              disabled={savingObservatorioPublico}
              onClick={() => handleToggleObservatorioPublico(!observatorioPublico)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B4D94] focus:ring-offset-2 ${
                observatorioPublico ? 'bg-[#0B4D94]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  observatorioPublico ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${observatorioPublico ? 'text-[#0B4D94] font-bold' : 'text-slate-500'}`}>
              Público
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => handleToggleObservatorioPublico(true)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
              observatorioPublico
                ? 'bg-white border-[#0B4D94] ring-1 ring-[#0B4D94] shadow-xs'
                : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">#observatorio público</span>
              <input
                type="radio"
                name="obs_visibility"
                checked={observatorioPublico}
                onChange={() => handleToggleObservatorioPublico(true)}
                className="text-[#0B4D94]"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cualquier visitante puede verlo desde el menú sin necesidad de iniciar sesión.
            </p>
          </div>

          <div
            onClick={() => handleToggleObservatorioPublico(false)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
              !observatorioPublico
                ? 'bg-white border-[#0B4D94] ring-1 ring-[#0B4D94] shadow-xs'
                : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">#observatorio privado</span>
              <input
                type="radio"
                name="obs_visibility"
                checked={!observatorioPublico}
                onChange={() => handleToggleObservatorioPublico(false)}
                className="text-[#0B4D94]"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requiere inicio de sesión obligatorio para ver cualquier dato o gráfico institucional.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Panel 1: Cambio de Contraseña */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-200">
            <KeyRound className="w-5 h-5 text-[#0B4D94]" />
            <div>
              <h3 className="font-bold text-sm">Cambiar Contraseña de Acceso</h3>
              <p className="text-[11px] text-slate-500">
                Usuario activo: <strong className="font-mono text-[#0B4D94]">{currentUser?.username}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contraseña Actual</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showCurrentPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showNewPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Repita la nueva contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showConfirmPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4"
            >
              {changingPass ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Actualizar Contraseña Ahora</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Panel 2: Matriz de Permisos para ADMIN */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-200">
            <Sliders className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-sm">Privilegios y Accesos para el Rol ADMIN</h3>
              <p className="text-[11px] text-slate-500">
                Active las secciones de la web que podrán ver y gestionar los administradores
              </p>
            </div>
          </div>

          {!isSuperAdmin ? (
            <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs">
              Solo el <strong>SUPERADMIN</strong> puede modificar la matriz de privilegios del sistema.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Observatorio e Indicadores</p>
                  <p className="text-[10px] text-slate-400">Ver estadísticas dinámicas del PEI</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.observatorio}
                  onChange={e => setPermisos({ ...permisos, observatorio: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Directorio de Docentes y Fichas</p>
                  <p className="text-[10px] text-slate-400">Búsqueda y visualización de expedientes</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.docentes}
                  onChange={e => setPermisos({ ...permisos, docentes: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Censo PEI (Recopilación)</p>
                  <p className="text-[10px] text-slate-400">Registrar y actualizar fichas de docentes</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.encuesta}
                  onChange={e => setPermisos({ ...permisos, encuesta: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Generador de Reportes y PDF</p>
                  <p className="text-[10px] text-slate-400">Emisión de informes institucionales</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.reportes}
                  onChange={e => setPermisos({ ...permisos, reportes: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Carga Masiva CSV</p>
                  <p className="text-[10px] text-slate-400">Importación de lotes de docentes</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.carga_masiva}
                  onChange={e => setPermisos({ ...permisos, carga_masiva: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Gestión de Usuarios y Perfiles</p>
                  <p className="text-[10px] text-slate-400">Crear o modificar cuentas de encuestadores</p>
                </div>
                <input
                  type="checkbox"
                  checked={permisos.usuarios}
                  onChange={e => setPermisos({ ...permisos, usuarios: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
              </label>

              <button
                type="button"
                onClick={handleSavePermisos}
                disabled={savingPermisos}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4"
              >
                {savingPermisos ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Permisos...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Guardar Permisos de ADMIN</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Panel 3: Matriz de Permisos para ENCUESTADOR */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-200">
            <ClipboardEdit className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm">Privilegios y Accesos para el Rol ENCUESTADOR</h3>
              <p className="text-[11px] text-slate-500">
                Defina qué secciones estarán habilitadas para los usuarios con perfil de Encuestador
              </p>
            </div>
          </div>

          {!isSuperAdmin ? (
            <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs">
              Solo el <strong>SUPERADMIN</strong> puede modificar la matriz de privilegios de los encuestadores.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
                <div>
                  <p className="font-bold text-slate-800">Censo PEI (Recopilación)</p>
                  <p className="text-[10px] text-slate-400">Captura de fichas docentes y fotos</p>
                </div>
                <input
                  type="checkbox"
                  checked={encuestadorPermisos.encuesta}
                  onChange={e =>
                    setEncuestadorPermisos({ ...encuestadorPermisos, encuesta: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
                <div>
                  <p className="font-bold text-slate-800">Directorio de Docentes</p>
                  <p className="text-[10px] text-slate-400">Consultar y ver fichas censadas</p>
                </div>
                <input
                  type="checkbox"
                  checked={encuestadorPermisos.docentes}
                  onChange={e =>
                    setEncuestadorPermisos({ ...encuestadorPermisos, docentes: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
                <div>
                  <p className="font-bold text-slate-800">Observatorio e Indicadores</p>
                  <p className="text-[10px] text-slate-400">Ver métricas globales institucionales</p>
                </div>
                <input
                  type="checkbox"
                  checked={encuestadorPermisos.observatorio}
                  onChange={e =>
                    setEncuestadorPermisos({ ...encuestadorPermisos, observatorio: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
                <div>
                  <p className="font-bold text-slate-800">Generador de Reportes y PDF</p>
                  <p className="text-[10px] text-slate-400">Permitir exportar informes ejecutivos</p>
                </div>
                <input
                  type="checkbox"
                  checked={encuestadorPermisos.reportes}
                  onChange={e =>
                    setEncuestadorPermisos({ ...encuestadorPermisos, reportes: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
                <div>
                  <p className="font-bold text-slate-800">Carga Masiva CSV</p>
                  <p className="text-[10px] text-slate-400">Importación de lotes en formato CSV</p>
                </div>
                <input
                  type="checkbox"
                  checked={encuestadorPermisos.carga_masiva}
                  onChange={e =>
                    setEncuestadorPermisos({ ...encuestadorPermisos, carga_masiva: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveEncuestadorPermisos}
                  disabled={savingEncuestadorPermisos}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingEncuestadorPermisos ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Guardar Permisos de ENCUESTADOR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PANEL: CATÁLOGO OFICIAL DE UNIVERSIDADES DE VENEZUELA (CRUD) */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#0B4D94] text-white rounded-xl shadow-xs mt-0.5">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Catálogo Oficial de Universidades de Venezuela
                </h3>
                <span className="bg-blue-100 text-[#0B4D94] border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {universidades.length} Instituciones
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Gestión integral (CRUD) del catálogo de universidades nacionales para el censo y el cálculo automático de formación pública vs. privada en el Observatorio.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetUniversidades}
              disabled={restoringUnivs}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Restaura la lista original de 59 universidades"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0B4D94] ${restoringUnivs ? 'animate-spin' : ''}`} />
              <span>Restaurar Catálogo Base</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateUniv}
              className="bg-[#0B4D94] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Universidad</span>
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroTipoUniv('TODAS')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                filtroTipoUniv === 'TODAS'
                  ? 'bg-[#0B4D94] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({universidades.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoUniv('Pública')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                filtroTipoUniv === 'Pública'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Públicas ({universidades.filter(u => u.tipo === 'Pública').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoUniv('Privada')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                filtroTipoUniv === 'Privada'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Privadas ({universidades.filter(u => u.tipo === 'Privada').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, sigla o estado..."
              value={searchUniv}
              onChange={e => setSearchUniv(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0B4D94]"
            />
          </div>
        </div>

        {/* Table of Universities */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold z-10">
              <tr>
                <th className="py-2.5 px-3">Institución Universitaria</th>
                <th className="py-2.5 px-3">Siglas</th>
                <th className="py-2.5 px-3">Régimen</th>
                <th className="py-2.5 px-3">Subtipo</th>
                <th className="py-2.5 px-3">Sede / Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingUnivs ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B4D94] mb-1" />
                    Cargando catálogo universitario...
                  </td>
                </tr>
              ) : filteredUniversidades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron universidades con ese criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUniversidades.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {u.nombre}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 font-bold">
                      {u.siglas || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        u.tipo === 'Privada'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {u.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {u.subtipo || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {u.sede_principal ? `${u.sede_principal}${u.estado ? `, ${u.estado}` : ''}` : (u.estado || '-')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUniv(u)}
                          className="p-1 text-slate-400 hover:text-[#0B4D94] hover:bg-blue-50 rounded transition-colors"
                          title="Editar universidad"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUniv(u.id, u.nombre)}
                          disabled={deletingUnivId === u.id}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                          title="Eliminar universidad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL DESTACADO: PASE A PRODUCCIÓN Y LIMPIEZA DE DATOS DE PRUEBA */}
      {isSuperAdmin && (
        <div className="p-6 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-4 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200/70 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">
                    Pase a Producción • Limpieza de Docentes de Prueba
                  </h3>
                  <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    SUPERADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Permite depurar y limpiar la nómina de docentes ingresada durante la etapa de pruebas para dejar el sistema preparado para el despliegue oficial en producción.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDescargarRespaldo}
                disabled={descargandoRespaldo}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-2xs disabled:opacity-50"
              >
                {descargandoRespaldo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0B4D94]" />
                    <span>Generando Respaldo...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#0B4D94]" />
                    <span>Descargar Respaldo CSV</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmText('');
                  setModalLimpiezaOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar Datos de Prueba</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 bg-white/80 border border-rose-100 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Opción 1: Vaciado Total de la Tabla
              </span>
              <p className="text-[11px] text-slate-500">
                Elimina el 100% de los docentes registrados de prueba. El sistema quedará en cero (0) registros, listo para la carga masiva de la nómina real.
              </p>
            </div>

            <div className="p-3.5 bg-white/80 border border-rose-100 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Opción 2: Reiniciar Censo a Pendientes
              </span>
              <p className="text-[11px] text-slate-500">
                Conserva la lista básica de docentes (Cédula, Nombre y Cargo) pero limpia todas las respuestas del censo para que puedan ser entrevistados de nuevo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SEGURIDAD: LIMPIEZA PARA PASE A PRODUCCIÓN */}
      {modalLimpiezaOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 animate-slide-in">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Confirmación de Limpieza para Pase a Producción
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción modificará la base de datos de docentes del sistema PEI UPTPC.
                </p>
              </div>
            </div>

            {/* Selector de Modalidad */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Seleccione la modalidad de limpieza:</label>
              
              <div
                onClick={() => setTipoLimpieza('VACIAR_TODO')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tipoLimpieza === 'VACIAR_TODO'
                    ? 'bg-rose-50/50 border-rose-500 ring-1 ring-rose-500 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Vaciar totalmente la tabla de docentes</span>
                  <input
                    type="radio"
                    name="tipo_limpieza"
                    checked={tipoLimpieza === 'VACIAR_TODO'}
                    onChange={() => setTipoLimpieza('VACIAR_TODO')}
                    className="text-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Elimina todos los registros de docentes existentes (recomendado si desea importar la nómina definitiva desde Carga Masiva CSV).
                </p>
              </div>

              <div
                onClick={() => setTipoLimpieza('REINICIAR_CENSO')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tipoLimpieza === 'REINICIAR_CENSO'
                    ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Reiniciar Censo (Conservar Nómina Base)</span>
                  <input
                    type="radio"
                    name="tipo_limpieza"
                    checked={tipoLimpieza === 'REINICIAR_CENSO'}
                    onChange={() => setTipoLimpieza('REINICIAR_CENSO')}
                    className="text-amber-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mantiene Cédulas y Nombres ya existentes, pero elimina expedientes de prueba y vuelve a colocar a todos los docentes como Pendientes.
                </p>
              </div>
            </div>

            {/* Input de Seguridad con Palabra Clave */}
            <div className="space-y-1.5 pt-1 text-xs">
              <label className="block font-bold text-slate-800">
                Para confirmar la operación, escriba <span className="font-mono text-rose-600 font-black">PRODUCCION</span> a continuación:
              </label>
              <input
                type="text"
                placeholder="Escriba PRODUCCION para confirmar"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Botonera del Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalLimpiezaOpen(false);
                  setConfirmText('');
                }}
                disabled={limpiandoDocentes}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleEjecutarLimpieza}
                disabled={
                  limpiandoDocentes ||
                  (confirmText.trim().toUpperCase() !== 'PRODUCCION' &&
                    confirmText.trim().toUpperCase() !== 'LIMPIAR')
                }
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {limpiandoDocentes ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ejecutando Limpieza...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar y Limpiar Datos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR UNIVERSIDAD */}
      {modalUnivOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-slide-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-[#0B4D94]" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingUniv ? 'Editar Universidad' : 'Nueva Universidad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalUnivOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUniv} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Universidad Central de Venezuela"
                  value={univNombre}
                  onChange={e => setUnivNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Siglas</label>
                  <input
                    type="text"
                    placeholder="Ej. UCV, UC, USB"
                    value={univSiglas}
                    onChange={e => setUnivSiglas(e.target.value.toUpperCase())}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono uppercase focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Régimen Institucional *</label>
                  <select
                    value={univTipo}
                    onChange={e => setUnivTipo(e.target.value as 'Pública' | 'Privada')}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  >
                    <option value="Pública">Pública</option>
                    <option value="Privada">Privada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtipo</label>
                  <input
                    type="text"
                    placeholder="Ej. Autónoma, Experimental, Politécnica..."
                    value={univSubtipo}
                    onChange={e => setUnivSubtipo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sede Principal</label>
                  <input
                    type="text"
                    placeholder="Ej. Valencia, Caracas, Mérida"
                    value={univSede}
                    onChange={e => setUnivSede(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado / Entidad Federal</label>
                <input
                  type="text"
                  placeholder="Ej. Carabobo, Distrito Capital, Zulia"
                  value={univEstado}
                  onChange={e => setUnivEstado(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalUnivOpen(false)}
                  disabled={savingUniv}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUniv}
                  className="bg-[#0B4D94] hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingUniv ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Universidad</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


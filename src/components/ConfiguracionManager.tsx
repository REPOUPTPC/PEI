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
} from 'lucide-react';
import { AdminPermisos, EncuestadorPermisos, Usuario } from '@/lib/types';
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

  // Load config on mount
  useEffect(() => {
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

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';

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
    </div>
  );
};


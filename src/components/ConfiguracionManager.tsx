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
} from 'lucide-react';
import { AdminPermisos, Usuario } from '@/lib/types';
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

  // Load config on mount
  useEffect(() => {
    fetch('/api/configuracion')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config?.admin_permisos) {
          setPermisos(data.config.admin_permisos);
        }
      })
      .catch(console.error);
  }, []);

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
        showToast('success', 'Permisos Actualizados', 'La matriz de accesos para el rol ADMIN fue guardada.');
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
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                placeholder="Repita la nueva contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
              />
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
                    <span>Guardar Configuración de Permisos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


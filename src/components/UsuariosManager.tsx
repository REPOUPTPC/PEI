import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Key,
  Shield,
  UserCheck,
  RefreshCw,
  Search,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Usuario, RolUsuario } from '@/lib/types';
import { useToast } from './Toast';

export const UsuariosManager: React.FC = () => {
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState<RolUsuario>('ENCUESTADOR');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      }
    } catch (err: any) {
      showToast('error', 'Error al cargar usuarios', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setNombreCompleto('');
    setRol('ENCUESTADOR');
    setActivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(''); // leave blank if keeping same password
    setShowPassword(false);
    setNombreCompleto(user.nombre_completo);
    setRol(user.rol);
    setActivo(user.activo === 1);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !nombreCompleto.trim()) {
      showToast('error', 'Datos requeridos', 'Ingrese el usuario y nombre completo.');
      return;
    }

    if (!editingUser && !password.trim()) {
      showToast('error', 'Contraseña requerida', 'Ingrese una contraseña para el nuevo usuario.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingUser;
      const url = '/api/usuarios';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? { id: editingUser.id, username, password, nombre_completo: nombreCompleto, rol, activo: activo ? 1 : 0 }
        : { username, password, nombre_completo: nombreCompleto, rol, activo: activo ? 1 : 0 };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', isEdit ? 'Usuario Actualizado' : 'Usuario Creado', `Se guardó a ${username} correctamente.`);
        setModalOpen(false);
        fetchUsuarios();
      } else {
        showToast('error', 'Error al guardar', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/usuarios?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Usuario Eliminado', `Se eliminó a ${deleteTarget.username}.`);
        setDeleteTarget(null);
        fetchUsuarios();
      } else {
        showToast('error', 'Error al eliminar', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    }
  };

  return (
    <div className="card-white p-6 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in shadow-md">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Control de Accesos y Seguridad</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Gestión de Usuarios y Perfiles del Sistema PEI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cree y administre cuentas con roles de <strong>SUPERADMIN</strong>, <strong>ADMIN</strong> y{' '}
            <strong>ENCUESTADOR</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsuarios}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Explicación de Perfiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
          <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            SUPERADMIN
          </span>
          <p className="text-xs text-slate-700 mt-2 font-medium">
            Control total del sistema (CRUD completo), gestión de usuarios y configuración de permisos globales.
          </p>
        </div>

        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl">
          <span className="bg-[#0B4D94] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            ADMIN
          </span>
          <p className="text-xs text-slate-700 mt-2 font-medium">
            Acceso a los módulos asignados y definidos por el SUPERADMIN en la sección de Configuración.
          </p>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            ENCUESTADOR
          </span>
          <p className="text-xs text-slate-700 mt-2 font-medium">
            Permitido únicamente para recopilación de información: Censo PEI (#encuesta) y Directorio (#docentes).
          </p>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Nombre Completo</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold font-mono text-[#0B4D94]">
                  {u.username}
                </td>
                <td className="py-3 px-4 text-slate-800 font-semibold">{u.nombre_completo}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      u.rol === 'SUPERADMIN'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : u.rol === 'ADMIN'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {u.activo === 1 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Inactivo</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Editar usuario"
                      className="p-1.5 text-slate-600 hover:text-[#0B4D94] hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {u.username !== 'CIENCIA_TECNOLOGIA' && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        title="Eliminar usuario"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-slide-in">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0B4D94]" />
              <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ENCUESTADOR_01"
                  value={username}
                  onChange={e => setUsername(e.target.value.toUpperCase())}
                  disabled={editingUser?.username === 'CIENCIA_TECNOLOGIA'}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono uppercase focus:ring-2 focus:ring-[#0B4D94] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Operador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Carlos Pérez"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contraseña {editingUser && '(Dejar en blanco para mantener la actual)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol en el Sistema</label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value as RolUsuario)}
                  disabled={editingUser?.username === 'CIENCIA_TECNOLOGIA'}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-semibold focus:ring-2 focus:ring-[#0B4D94] focus:outline-none disabled:bg-slate-100"
                >
                  <option value="ENCUESTADOR">ENCUESTADOR (Solo Censo y Directorio)</option>
                  <option value="ADMIN">ADMIN (Acceso a módulos configurados)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Acceso total)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={e => setActivo(e.target.checked)}
                    disabled={editingUser?.username === 'CIENCIA_TECNOLOGIA'}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span className="font-semibold text-slate-700">Usuario Activo</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold px-5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-slide-in">
            <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>¿Eliminar Usuario?</span>
            </h3>

            <p className="text-xs text-slate-600">
              ¿Está seguro de que desea eliminar al usuario{' '}
              <strong className="text-slate-900 font-mono">{deleteTarget.username}</strong> ({deleteTarget.nombre_completo})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


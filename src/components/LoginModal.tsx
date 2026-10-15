import React, { useState } from 'react';
import { LogIn, X, Lock, User, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { Usuario } from '@/lib/types';
import { useToast } from './Toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Usuario, permisos: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showToast('error', 'Campos Incompletos', 'Por favor ingrese usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        showToast('success', 'Sesión Iniciada', `Bienvenido(a), ${data.user.nombre_completo}`);
        onLoginSuccess(data.user, data.user.permisos);
        onClose();
      } else {
        showToast('error', 'Fallo de Autenticación', data.error || 'Credenciales incorrectas');
      }
    } catch (err: any) {
      showToast('error', 'Error de Red', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSuperadmin = () => {
    setUsername('CIENCIA_TECNOLOGIA');
    setPassword('CYT_01012023');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-slate-200 animate-slide-in relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding Membrete Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0B4D94] to-[#1E6BB8] text-white shadow-md mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Iniciar Sesión en PEI</h3>
            <p className="text-xs text-slate-500">Unidad de Ciencia y Tecnología • Rectorado UPTPC</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ej. CIENCIA_TECNOLOGIA"
                value={username}
                onChange={e => setUsername(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 font-mono uppercase focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Acceder al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Botón rápido para SuperAdmin inicial */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleQuickSuperadmin}
            className="text-[11px] font-semibold text-[#0B4D94] hover:underline"
          >
            Rellenar credenciales oficiales de SUPERADMIN
          </button>
        </div>
      </div>
    </div>
  );
};

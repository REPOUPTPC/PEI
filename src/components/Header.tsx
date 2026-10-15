import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  ClipboardEdit,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { Usuario, AdminPermisos } from '@/lib/types';

interface HeaderProps {
  currentHash: string;
  currentUser: Usuario | null;
  adminPermisos: AdminPermisos | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onQuickSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHash,
  currentUser,
  adminPermisos,
  onOpenLogin,
  onLogout,
  onQuickSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      window.location.hash = '#docentes';
      onQuickSearch(searchVal.trim());
    }
  };

  // Determine section accessibility based on user role and permissions
  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';
  const isAdmin = currentUser?.rol === 'ADMIN';
  const isEncuestador = currentUser?.rol === 'ENCUESTADOR';
  const isLoggedIn = !!currentUser;

  const canAccessEncuesta = isSuperAdmin || isEncuestador || (isAdmin && adminPermisos?.encuesta !== false);
  const canAccessCargaMasiva = isSuperAdmin || (isAdmin && adminPermisos?.carga_masiva !== false);
  const canAccessReportes = isSuperAdmin || (isAdmin && adminPermisos?.reportes !== false);
  const canAccessDashboard = isSuperAdmin || isAdmin;
  const canAccessUsuarios = isSuperAdmin || (isAdmin && adminPermisos?.usuarios === true);
  const canAccessConfig = isSuperAdmin || (isAdmin && adminPermisos?.configuracion === true);

  const navItems = [
    {
      hash: '#observatorio',
      label: 'Observatorio',
      icon: BarChart3,
      visible: true,
      desc: 'Métricas e Indicadores Institucionales',
    },
    {
      hash: '#docentes',
      label: 'Docentes',
      icon: Users,
      visible: true,
      desc: 'Directorio y Fichas Profesionales',
    },
    {
      hash: '#encuesta',
      label: 'Censo PEI',
      icon: ClipboardEdit,
      visible: canAccessEncuesta,
      desc: 'Formulario de Recopilación Integral',
    },
    {
      hash: '#carga-masiva',
      label: 'Carga Masiva',
      icon: FileSpreadsheet,
      visible: canAccessCargaMasiva,
      desc: 'Importación Precargada CSV',
    },
    {
      hash: '#reportes',
      label: 'Reportes',
      icon: FileText,
      visible: canAccessReportes,
      desc: 'Estadísticas y Exportación PDF',
    },
    {
      hash: '#dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: canAccessDashboard,
      desc: 'Panel de Control Administrativo',
    },
    {
      hash: '#usuarios',
      label: 'Usuarios',
      icon: ShieldAlert,
      visible: canAccessUsuarios,
      desc: 'Gestión de Perfiles y Accesos',
    },
    {
      hash: '#configuracion',
      label: 'Configuración',
      icon: Settings,
      visible: canAccessConfig,
      desc: 'Permisos de Roles y Seguridad',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner / Membrete Institucional */}
      <div className="bg-gradient-to-r from-[#073262] via-[#0B4D94] to-[#1E6BB8] text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logos and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <img
                src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/LOGO_UPTPC.png"
                alt="Logo UPTPC"
                className="h-10 sm:h-12 w-auto object-contain filter drop-shadow"
              />
              <img
                src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/logoRECTORADO.png"
                alt="Logo Rectorado"
                className="h-10 sm:h-12 w-auto object-contain filter drop-shadow"
              />
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-blue-100">
                UNIVERSIDAD POLITECNICA TERRITORIAL DE PUERTO CABELLO
              </p>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>PEI</span>
                <span className="text-xs sm:text-sm font-normal text-blue-100 hidden sm:inline">
                  — Programa De Evaluación Institucional
                </span>
                <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 shadow-sm">
                  RECTORADO
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Search & User Auth Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Buscar cédula o nombre..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="w-full bg-white/15 text-white placeholder-blue-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-2.5 pointer-events-none" />
            </form>

            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                <div className="text-right hidden md:block">
                  <p className="text-[11px] font-semibold text-white leading-tight">
                    {currentUser.nombre_completo || currentUser.username}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isSuperAdmin
                        ? 'bg-amber-400 text-slate-950'
                        : isAdmin
                        ? 'bg-blue-300 text-blue-950'
                        : 'bg-emerald-400 text-emerald-950'
                    }`}
                  >
                    {currentUser.rol}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acceder</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 text-white hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar (Hash Routing) */}
      <nav className="max-w-7xl mx-auto px-4">
        <div className="hidden sm:flex items-center justify-start space-x-1 py-1.5 overflow-x-auto">
          {navItems
            .filter(item => item.visible)
            .map(item => {
              const Icon = item.icon;
              const isActive = currentHash === item.hash || (item.hash === '#observatorio' && currentHash === '');

              return (
                <a
                  key={item.hash}
                  href={item.hash}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-50 text-[#0B4D94] border-b-2 border-[#0B4D94] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B4D94]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-slate-100 space-y-1">
            {navItems
              .filter(item => item.visible)
              .map(item => {
                const Icon = item.icon;
                const isActive = currentHash === item.hash || (item.hash === '#observatorio' && currentHash === '');

                return (
                  <a
                    key={item.hash}
                    href={item.hash}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-[#0B4D94] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <div>
                      <p>{item.label}</p>
                      <p className="text-[11px] text-slate-400 font-normal">{item.desc}</p>
                    </div>
                  </a>
                );
              })}
          </div>
        )}
      </nav>
    </header>
  );
};

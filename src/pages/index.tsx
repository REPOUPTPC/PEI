import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Observatorio } from '@/components/Observatorio';
import { DirectorioDocentes } from '@/components/DirectorioDocentes';
import { EncuestaForm } from '@/components/EncuestaForm';
import { CargaMasivaCSV } from '@/components/CargaMasivaCSV';
import { ReportesView } from '@/components/ReportesView';
import { DashboardAdmin } from '@/components/DashboardAdmin';
import { UsuariosManager } from '@/components/UsuariosManager';
import { ConfiguracionManager } from '@/components/ConfiguracionManager';
import { DocenteFichaModal } from '@/components/DocenteFichaModal';
import { LoginModal } from '@/components/LoginModal';
import { useToast } from '@/components/Toast';
import { Docente, ObservatorioStats, Usuario, AdminPermisos, EncuestadorPermisos } from '@/lib/types';

export default function Home() {
  const { showToast } = useToast();

  // Navigation hash routing state
  const [currentHash, setCurrentHash] = useState<string>('#observatorio');

  // Auth & Session state
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [adminPermisos, setAdminPermisos] = useState<AdminPermisos | null>(null);
  const [encuestadorPermisos, setEncuestadorPermisos] = useState<EncuestadorPermisos | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<ObservatorioStats | null>(null);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active Modals & Selected Objects
  const [selectedDocenteForFicha, setSelectedDocenteForFicha] = useState<Docente | null>(null);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState<string>('');

  // 1. Initialize and listen to Hash Navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#observatorio';
      setCurrentHash(hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Set initial hash
    if (window.location.hash) {
      setCurrentHash(window.location.hash);
    } else {
      window.location.hash = '#observatorio';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Load stored session and permissions from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pei_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
      }

      const storedPermisos = localStorage.getItem('pei_permisos');
      if (storedPermisos) {
        setAdminPermisos(JSON.parse(storedPermisos));
      }

      const storedEncPermisos = localStorage.getItem('pei_encuestador_permisos');
      if (storedEncPermisos) {
        setEncuestadorPermisos(JSON.parse(storedEncPermisos));
      }
    } catch (e) {
      console.error('Error reading localStorage session:', e);
    }
  }, []);

  // 3. Load Stats and Docentes with resilient individual fetches
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);

    // Fetch stats
    try {
      const rStats = await fetch('/api/stats');
      const dStats = await rStats.json();
      if (dStats.success && dStats.stats) {
        setStats(dStats.stats);
      } else if (dStats.error) {
        console.warn('API Stats issue:', dStats.error);
        setLoadError(dStats.error);
      }
    } catch (err: any) {
      console.error('Error fetching /api/stats:', err);
      setLoadError(err.message || 'Error de conexión con /api/stats');
    }

    // Fetch docentes
    try {
      const rDoc = await fetch('/api/docentes?limit=500');
      const dDoc = await rDoc.json();
      if (dDoc.success && dDoc.docentes) {
        setDocentes(dDoc.docentes);
      }
    } catch (err: any) {
      console.error('Error fetching /api/docentes:', err);
    }

    // Fetch config
    try {
      const rCfg = await fetch('/api/configuracion');
      const dCfg = await rCfg.json();
      if (dCfg.success) {
        if (dCfg.config?.admin_permisos) {
          setAdminPermisos(dCfg.config.admin_permisos);
          localStorage.setItem('pei_permisos', JSON.stringify(dCfg.config.admin_permisos));
        }
        if (dCfg.config?.encuestador_permisos) {
          setEncuestadorPermisos(dCfg.config.encuestador_permisos);
          localStorage.setItem('pei_encuestador_permisos', JSON.stringify(dCfg.config.encuestador_permisos));
        }
      }
    } catch (err: any) {
      console.error('Error fetching /api/configuracion:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auth handlers
  const handleLoginSuccess = (user: Usuario, permisos: any) => {
    setCurrentUser(user);
    localStorage.setItem('pei_user', JSON.stringify(user));
    if (permisos) {
      setAdminPermisos(permisos);
      localStorage.setItem('pei_permisos', JSON.stringify(permisos));
    }
    // Navigate to dashboard if admin/superadmin
    if (user.rol === 'SUPERADMIN' || user.rol === 'ADMIN') {
      window.location.hash = '#dashboard';
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminPermisos(null);
    setEncuestadorPermisos(null);
    localStorage.removeItem('pei_user');
    localStorage.removeItem('pei_permisos');
    localStorage.removeItem('pei_encuestador_permisos');
    showToast('info', 'Sesión Cerrada', 'Ha salido del sistema correctamente.');
    window.location.hash = '#observatorio';
  };

  // Quick search handler from header
  const handleQuickSearch = (query: string) => {
    setInitialSearchTerm(query);
  };

  // Interaction handlers
  const handleSelectDocente = (docente: Docente) => {
    setSelectedDocenteForFicha(docente);
  };

  const handleEditDocente = (docente: Docente) => {
    setSelectedDocenteForFicha(null);
    setEditingDocente(docente);
    window.location.hash = '#encuesta';
  };

  const handleNewDocente = () => {
    setEditingDocente(null);
    window.location.hash = '#encuesta';
  };

  const handleSurveySuccess = () => {
    setEditingDocente(null);
    loadData();
    window.location.hash = '#docentes';
  };

  // Permission access checker
  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';
  const isAdmin = currentUser?.rol === 'ADMIN';
  const isEncuestador = currentUser?.rol === 'ENCUESTADOR';

  // Section render logic based on hash
  const renderCurrentSection = () => {
    switch (currentHash) {
      case '#observatorio':
      case '#inicio':
      case '':
        return (
          <Observatorio
            stats={stats}
            docentes={docentes}
            onSelectDocente={handleSelectDocente}
            onNavigateToEncuesta={() => (window.location.hash = '#encuesta')}
            loading={loadingData}
            error={loadError}
            onRetry={loadData}
          />
        );

      case '#docentes':
        return (
          <DirectorioDocentes
            docentes={docentes}
            onSelectDocente={handleSelectDocente}
            onEditDocente={handleEditDocente}
            onNewDocente={handleNewDocente}
            onRefresh={loadData}
            currentUser={currentUser}
            initialSearch={initialSearchTerm}
          />
        );

      case '#encuesta':
        if (!currentUser && !isEncuestador && !isAdmin && !isSuperAdmin) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-4">
              <h3 className="font-bold text-base text-slate-900">Acceso a Censo PEI</h3>
              <p className="text-xs text-slate-600">
                Para registrar o actualizar la evaluación institucional de un docente, debe identificarse como
                Encuestador o Administrador.
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Iniciar Sesión
              </button>
            </div>
          );
        }
        return (
          <EncuestaForm
            initialDocente={editingDocente}
            onSuccess={handleSurveySuccess}
            onCancel={() => (window.location.hash = '#docentes')}
            currentUser={currentUser}
          />
        );

      case '#carga-masiva': {
        const canCargaMasiva =
          isSuperAdmin ||
          (isAdmin && adminPermisos?.carga_masiva !== false) ||
          (isEncuestador && encuestadorPermisos?.carga_masiva === true);
        if (!canCargaMasiva) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-3">
              <h3 className="font-bold text-base text-rose-600">Acceso Restringido</h3>
              <p className="text-xs text-slate-600">
                La carga masiva requiere privilegios autorizados en el sistema.
              </p>
            </div>
          );
        }
        return <CargaMasivaCSV onSuccess={loadData} currentUser={currentUser} />;
      }

      case '#reportes': {
        const canReportes =
          !currentUser ||
          isSuperAdmin ||
          (isAdmin && adminPermisos?.reportes !== false) ||
          (isEncuestador && encuestadorPermisos?.reportes !== false);
        if (!canReportes) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-3">
              <h3 className="font-bold text-base text-rose-600">Acceso Restringido</h3>
              <p className="text-xs text-slate-600">
                Este módulo requiere privilegios autorizados por el Administrador.
              </p>
            </div>
          );
        }
        return (
          <ReportesView
            stats={stats}
            docentes={docentes}
            onSelectDocente={handleSelectDocente}
          />
        );
      }

      case '#dashboard':
        if (!currentUser) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-4">
              <h3 className="font-bold text-base text-slate-900">Panel de Control Administrativo</h3>
              <p className="text-xs text-slate-600">
                Inicie sesión con las credenciales de SUPERADMIN o Administrador para gestionar el PEI.
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Acceder como Administrador
              </button>
            </div>
          );
        }
        return (
          <DashboardAdmin
            stats={stats}
            docentes={docentes}
            currentUser={currentUser}
            onSelectDocente={handleSelectDocente}
          />
        );

      case '#usuarios':
        if (!isSuperAdmin && (!isAdmin || adminPermisos?.usuarios !== true)) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-3">
              <h3 className="font-bold text-base text-rose-600">Privilegios Insuficientes</h3>
              <p className="text-xs text-slate-600">
                Solo el <strong>SUPERADMIN</strong> (o administradores autorizados) pueden gestionar perfiles y usuarios.
              </p>
            </div>
          );
        }
        return <UsuariosManager />;

      case '#configuracion':
        if (!isSuperAdmin && (!isAdmin || adminPermisos?.configuracion !== true)) {
          return (
            <div className="card-white p-8 max-w-md mx-auto text-center space-y-3">
              <h3 className="font-bold text-base text-rose-600">Acceso Restringido</h3>
              <p className="text-xs text-slate-600">
                Sección disponible exclusivamente para configuración de seguridad del sistema.
              </p>
            </div>
          );
        }
        return (
          <ConfiguracionManager
            currentUser={currentUser}
            onPermissionsUpdated={loadData}
          />
        );

      default:
        return (
          <Observatorio
            stats={stats}
            docentes={docentes}
            onSelectDocente={handleSelectDocente}
            onNavigateToEncuesta={() => (window.location.hash = '#encuesta')}
            loading={loadingData}
            error={loadError}
            onRetry={loadData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Head>
        <title>PEI UPTPC • Programa De Evaluación Institucional</title>
      </Head>

      {/* Header con Membrete Oficial y Navegación Hash */}
      <Header
        currentHash={currentHash}
        currentUser={currentUser}
        adminPermisos={adminPermisos}
        encuestadorPermisos={encuestadorPermisos}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onQuickSearch={handleQuickSearch}
      />

      {/* Contenido Principal Dinámico según Hash */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {renderCurrentSection()}
      </main>

      {/* Footer Oficial con Logo CYT y Licencia Apache 3.0 */}
      <Footer />

      {/* MODAL: Ficha Integral del Docente (Apertura al hacer click en cualquier docente) */}
      <DocenteFichaModal
        docente={selectedDocenteForFicha}
        onClose={() => setSelectedDocenteForFicha(null)}
        onEdit={
          currentUser
            ? doc => {
                handleEditDocente(doc);
              }
            : undefined
        }
      />

      {/* MODAL: Login con credenciales SUPERADMIN o Encuestador */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, LogOut, Home, BarChart2,
  CheckCircle, ClipboardList, Layout, PieChart, FileText, Award
} from 'lucide-react';
import Swal from 'sweetalert2';
import NotificacionesPanel from '../components/NotificacionesPanel';
import PanelControl from '../components/PanelControl';
import ResultadosEvaluacionesProceso from '../components/ResultadosEvaluacionesProceso';
import AsistenciaPanel from '../components/AsistenciaPanel';
import AdminCursos from './adminCursos';
import AprobacionCursos from './aprobacionCursos';
import ReportesUsuario from '../components/ReportesUsuario';
import DocumentosConformidad from '../components/documentosConformidad';
import ResultadosPruebaTTHH from '../components/ResultadosPruebaTTHH';
import '../styles/pages/adminProcesoHome.css';

export default function AdminProcesoHome() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cursosPendientes, setCursosPendientes] = useState(0);
  const [activeTab, setActiveTab] = useState('inicio');

  useEffect(() => {
    const userData = localStorage.getItem("admin_proceso_user");
    if (!userData) {
      navigate('/admin/procesos');
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      setAdminUser(user);
    } catch (error) {
      console.error('Error parsing user:', error);
      navigate('/admin/procesos');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const esTalentoHumano = adminUser?.proceso_name?.trim().toUpperCase() === 'TALENTO HUMANO';

  // Cargar cursos pendientes + polling cada 30s (solo para TALENTO HUMANO)
  useEffect(() => {
    if (!esTalentoHumano) return;
    cargarCursosPendientes();
    const intervalo = setInterval(cargarCursosPendientes, 30_000);
    return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTalentoHumano]);

  const cargarCursosPendientes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cursos/pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setCursosPendientes(data.data?.length || 0);
    } catch (error) {
      console.error('Error cargando cursos pendientes:', error);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se cerrará tu sesión de administrador',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_proceso_user');
        navigate('/admin/procesos');
      }
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'gestionar-cursos', label: 'Gestionar Cursos', icon: BookOpen },
    ...(esTalentoHumano ? [{
      id: 'aprobacion', label: 'Aprobación de Cursos', icon: CheckCircle,
      badge: cursosPendientes
    }] : []),
    { id: 'resultados', label: 'Resultados de Evaluaciones', icon: BarChart2 },
    { id: 'asistencia', label: 'Asistencia', icon: ClipboardList },
    ...(esTalentoHumano ? [{ id: 'panel-control', label: 'Panel de Control', icon: Layout }] : []),
    ...(esTalentoHumano ? [{ id: 'reportes', label: 'Reportes', icon: PieChart }] : []),
    ...(esTalentoHumano ? [{ id: 'documentos-conformidad', label: 'Documentos de Conformidad', icon: FileText }] : []),
    ...(esTalentoHumano ? [{ id: 'prueba-tthh', label: 'Prueba Final TTHH', icon: Award }] : []),
  ];

  const tabTitles = {
    inicio: `Bienvenido, ${adminUser?.nombre}`,
    'gestionar-cursos': 'Gestionar Cursos',
    aprobacion: 'Aprobación de Cursos',
    resultados: 'Resultados de Evaluaciones',
    asistencia: 'Registro de Asistencia',
    'panel-control': 'Panel de Control',
    reportes: 'Reportes',
    'documentos-conformidad': 'Documentos de Conformidad',
    'prueba-tthh': 'Resultados Prueba Final – Talento Humano',
  };

  const handleNavClick = (item) => {
    if (item.disabled) return;
    // Al salir de 'aprobacion', refrescar el contador
    if (activeTab === 'aprobacion' && item.id !== 'aprobacion' && esTalentoHumano) {
      cargarCursosPendientes();
    }
    setActiveTab(item.id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="aph-welcome">
            <div className="aph-welcome-header">
              <p>Proceso: <strong>{adminUser?.proceso_name}</strong></p>
            </div>
            <div className="aph-quick-actions">
              {navItems.filter(i => !i.disabled && i.id !== 'inicio').map(item => (
                <div
                  key={item.id}
                  className="aph-action-card"
                  onClick={() => handleNavClick(item)}
                >
                  <div className="aph-action-icon">
                    <item.icon size={26} />
                  </div>
                  <div className="aph-action-text">
                    <div className="aph-action-title">{item.label}</div>
                    {item.badge > 0 && (
                      <div className="aph-action-badge-text">
                        {item.badge} pendiente{item.badge !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  {item.badge > 0 && (
                    <span className="aph-action-badge">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'gestionar-cursos':
        return <AdminCursos />;
      case 'aprobacion':
        return <AprobacionCursos />;
      case 'resultados':
        return <ResultadosEvaluacionesProceso onClose={() => setActiveTab('inicio')} />;
      case 'asistencia':
        return <AsistenciaPanel onClose={() => setActiveTab('inicio')} />;
      case 'panel-control':
        return esTalentoHumano
          ? <PanelControl onClose={() => setActiveTab('inicio')} />
          : null;
      case 'reportes':
        return esTalentoHumano ? <ReportesUsuario /> : null;
      case 'documentos-conformidad':
        return esTalentoHumano ? <DocumentosConformidad /> : null;
      case 'prueba-tthh':
        return esTalentoHumano ? <ResultadosPruebaTTHH /> : null;
      default:
        return null;
    }
  };

  const userInitial = adminUser?.nombre?.[0]?.toUpperCase() || 'A';

  return (
    <div className="aph-layout">

      {/* ── Sidebar ── */}
      <aside className="aph-sidebar">

        {/* Brand */}
        <div className="aph-brand">
          <div className="aph-brand-logo">SN</div>
          <div>
            <div className="aph-brand-name">SafeNova</div>
            <div className="aph-brand-tagline">Capacitaciones</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="aph-nav">
          <div className="aph-nav-section-label">MENÚ PRINCIPAL</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`aph-nav-item${activeTab === item.id && !item.href ? ' active' : ''}${item.disabled ? ' disabled' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              <span className="aph-nav-icon"><item.icon size={17} /></span>
              <span className="aph-nav-label">{item.label}</span>
              {item.badge > 0 && <span className="aph-nav-badge">{item.badge}</span>}
              {item.disabled && <span className="aph-nav-soon">Pronto</span>}
            </button>
          ))}
        </nav>

        {/* Footer: usuario + logout */}
        <div className="aph-sidebar-footer">
          <div className="aph-sidebar-user">
            <div className="aph-user-avatar">{userInitial}</div>
            <div className="aph-user-info">
              <div className="aph-user-name">{adminUser?.nombre}</div>
              <div className="aph-user-role">Admin Proceso</div>
            </div>
          </div>
          <button className="aph-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="aph-main">

        {/* Top Header */}
        <header className="aph-header">
          <div className="aph-header-left">
            <div className="aph-breadcrumb">
              Admin <span>›</span> {tabTitles[activeTab] || 'Inicio'}
            </div>
            <h1 className="aph-header-title">{tabTitles[activeTab] || 'Inicio'}</h1>
          </div>
          <div className="aph-header-right">
            <NotificacionesPanel />
          </div>
        </header>

        {/* Page Content */}
        <main className="aph-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

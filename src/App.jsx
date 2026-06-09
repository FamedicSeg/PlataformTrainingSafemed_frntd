// App.js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Home from './pages/inicio';
import Courses from './pages/cursos';
import AdminPrincipal from './pages/adminPrincipal';
import Login from './pages/login';
import LoginNombre from './pages/principal';
import Curso from './cursos/TalentoHumano/curso1/curso1';
import Curso2 from './cursos/TalentoHumano/curso2/curso2';
import Curso3 from './cursos/TalentoHumano/curso3/curso3';
import Curso4 from './cursos/TalentoHumano/curso4/curso4';
import Curso5 from './cursos/TalentoHumano/curso5/curso5';
import Navbar from './pages/navbar';
import Navbar2 from './pages/navbar2';
import Procesos from './pages/procesos';
import AdminTalentoHumano from './procesos/adminTTHH';
import LoginAdminProceso from './pages/adminProcesos';
import ScrollToTop from './pages/scrollToTop';
import Soporte from './pages/soporte';
import AdminDireccion from './procesos/adminDireccion';
import DocumentoForm from './cursos/TalentoHumano/curso5/documentoForm';
import Sidebar from './pages/sidebar';

import { cursoDerechosLaborales } from "./cursos/TalentoHumano/curso1/datos_curso";
import { cursoIgualdadGenero } from "./cursos/TalentoHumano/curso2/datos_curso2";
import { cursoErradicacionViolencia } from "./cursos/TalentoHumano/curso3/datos_curso3";
import { cursoOtrosRelacionados } from './cursos/TalentoHumano/curso4/datos_curso4';
import {cursoReglamentoInterno} from './cursos/TalentoHumano/curso5/datos_curso5';

import Prueba from './pages/prueba';

// COMPONENTE SIMPLIFICADO PARA RUTAS PROTEGIDAS
// COMPONENTE MEJORADO PARA RUTAS PROTEGIDAS
function ProtectedUserRoute({ children }) {
  const location = useLocation();
  const [authCheck, setAuthCheck] = useState({
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar múltiples posibles tokens
        const userToken = localStorage.getItem("user_token");
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        const token = localStorage.getItem("token");
        
        // También verificar sessionStorage como respaldo
        const sessionToken = sessionStorage.getItem("user_token");
        
        const authenticated = !!(
          userToken || 
          isLoggedIn === "true" || 
          token || 
          sessionToken
        );
        
        console.log("🔐 ProtectedUserRoute - Verificación completada");
        console.log("   Ruta:", location.pathname);
        console.log("   Autenticado:", authenticated);
        console.log("   Tokens encontrados:", {
          user_token: userToken,
          isLoggedIn,
          token,
          sessionToken
        });
        
        setAuthCheck({
          isLoading: false,
          isAuthenticated: authenticated
        });
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setAuthCheck({
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    // Pequeño delay para asegurar que localStorage esté listo
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Mostrar loading mientras verifica
  if (authCheck.isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!authCheck.isAuthenticated) {
    console.log("❌ Usuario no autenticado, redirigiendo a /");
    
    // Opcional: guardar la ruta intentada para redirigir después del login
    if (location.pathname !== "/") {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
    }
    
    return <Navigate to="/" replace />;
  }
  
  // Usuario autenticado, mostrar contenido
  console.log("✅ Usuario autenticado, permitiendo acceso a:", location.pathname);
  return <>{children}</>;
}

// COMPONENTE PARA RUTAS DE ADMIN
function PrivateRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  return token ? children : <Navigate to="/admin" replace />;
}

// LAYOUT CON CONTROL DEL NAV - MODIFICADO PARA ARREGLAR SCROLL
function Layout({ children }) {
  const location = useLocation();

  // Scroll al top cada vez que cambia la ruta
  useEffect(() => {
    // Función para hacer scroll al top
    const scrollToTop = () => {
      // Método 1: window.scrollTo
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      
      // Método 2: Propiedades del DOM
      if (document.documentElement.scrollTop > 0) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body.scrollTop > 0) {
        document.body.scrollTop = 0;
      }
      
      // Método 3: requestAnimationFrame para asegurar
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    };

    // Ejecutar inmediatamente
    scrollToTop();
    
    // Y también después de un pequeño delay por si acaso
    const timer = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Determinar qué navbar mostrar
  const renderNavbar = () => {
    // Rutas sin navbar
    if (["/", "/admin", "/admin/procesos","/adminPrincipal", "/sidebar"].includes(location.pathname)) {
      return null;
    }
    
    // Ruta con Navbar2 (admin)
    if (location.pathname.startsWith("/admin")) {
      return <Navbar2 />;
    }
    // Todas las demás rutas con Navbar normal
    return <Navbar />;
  };

  // rutas donde NO debe aparecer el FOOTER
  const hideFooterRoutes = ["/", "/admin", "/admin/procesos"];
  const hideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <>
      {/* ScrollToTop debe estar aquí para funcionar correctamente */}
      <ScrollToTop />
      {renderNavbar()}
      
      {/* CONTENIDO PRINCIPAL - SIN CLASES EXTRA QUE ROMPAN EL LAYOUT */}
      <main className="main-content" style={{ 
        minHeight: 'calc(100vh - 200px)',
        width: '100%'
      }}>
        {children}
      </main>

      {!hideFooter && (
        <footer className="bg-light py-3 text-center border-top footer-full" style={{ 
          width: '100%',
          position: 'relative',
          bottom: 0
        }}>
          <img
            src="/img/imagen2.jpeg"
            alt="Dhisve2"
            className="mt-3 w-100"
            style={{ height: "200px", objectFit: "cover" }}
          />
          <small className="footer-full">
            Copyright © 2025, DHISVE | Sistema de Capacitación Interna | Todos los derechos reservados | Analista de Transformaciión Digital
          </small>
        </footer>
      )}
    </>
  );
}

// APP PRINCIPAL (SIMPLIFICADA)
function App() {
  // Solo un estado para forzar re-render cuando cambie auth
  const [authVersion, setAuthVersion] = useState(0);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("🔄 Storage cambiado, forzando re-render");
      setAuthVersion(prev => prev + 1);
    };

    // Escuchar evento 'storage' (cambios desde otras pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // También monitorear cambios desde la misma pestaña
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key.includes('token') || key.includes('LoggedIn')) {
        setTimeout(() => handleStorageChange(), 0);
      }
    };
    
    localStorage.removeItem = function(key) {
      originalRemoveItem.apply(this, [key]);
      if (key.includes('token') || key.includes('LoggedIn')) {
        setTimeout(() => handleStorageChange(), 0);
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, []);

  console.log("App renderizado (versión auth:", authVersion, ")");

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Rutas públicas (acceso sin login) */}
          <Route path="/" element={<LoginNombre />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/procesos" element={<LoginAdminProceso />} />
          <Route path="/adminPrincipal" element={<AdminPrincipal />} />
          <Route path="/sidebar" element={<Sidebar />} />
          

          {/* Rutas protegidas para usuarios logueados */}
          <Route path="/inicio" element={<ProtectedUserRoute><Home /></ProtectedUserRoute>} />
          <Route path="/soporte" element={<ProtectedUserRoute><Soporte /></ProtectedUserRoute>} />
          <Route path="/documento-form" element={<DocumentoForm />} />
          <Route 
            path="/courses" 
            element={
              <ProtectedUserRoute>
                <Courses />
              </ProtectedUserRoute>
            } 
          />
          
          <Route 
            path="/procesos" 
            element={
              <ProtectedUserRoute>
                <Procesos />
              </ProtectedUserRoute>
            } 
          />

          {/* Cursos protegidos */}
          <Route 
            path="/courses/derechoslaborales" 
            element={
              <ProtectedUserRoute>
                <Curso curso={cursoDerechosLaborales} />
              </ProtectedUserRoute>
            } 
          />
          
          <Route 
            path="/courses/igualdadgenero" 
            element={
              <ProtectedUserRoute>
                <Curso2 curso={cursoIgualdadGenero} />
              </ProtectedUserRoute>
            } 
          />
          
          <Route 
            path="/courses/erradicacionviolencia" 
            element={
              <ProtectedUserRoute>
                <Curso3 curso={cursoErradicacionViolencia} />
              </ProtectedUserRoute>
            } 
          />
          
          <Route 
            path="/courses/otrosrelacionados" 
            element={
              <ProtectedUserRoute>
                <Curso4 curso={cursoOtrosRelacionados} />
              </ProtectedUserRoute>
            } 
          />

          <Route 
            path="/courses/reglamentointerno" 
            element={
              <ProtectedUserRoute>
                <Curso5 curso={cursoReglamentoInterno} />
              </ProtectedUserRoute>
            } 
          />

          {/* Prueba final protegida */}
          <Route 
            path="/prueba" 
            element={
              <ProtectedUserRoute>
                <Prueba />
              </ProtectedUserRoute>
            } 
          />

          {/* Rutas protegidas de administrador */}
          <Route 
            path="/admin/Talento Humano" 
            element={
              <PrivateRoute>
                <AdminTalentoHumano />
              </PrivateRoute>
            }
          />
          <Route 
            path="/admin/Dirección" 
            element={
              <PrivateRoute>
                <AdminDireccion />
              </PrivateRoute>
            }
          />

          {/* Ruta por defecto/404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
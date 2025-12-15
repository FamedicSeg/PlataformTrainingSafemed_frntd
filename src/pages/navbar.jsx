import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react"; 
import Swal from "sweetalert2";
import "../styles/pages/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true); // ⬅️ ESTADO
  const navbarRef = useRef(null); // ⬅️ REF PARA DETECTAR CLICS EXTERNOS

  const handleLogout = async (e) => {
  e.preventDefault();
  // Cerrar el navbar en móvil para mejorar UX
  setIsNavCollapsed(true);
  
  const result = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: "Selecciona una opción",
    icon: 'question',
    // Evita cierres accidentales por clic fuera, ESC o Enter
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    focusConfirm: true,
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar'
  });
  
  if (result.isConfirmed) {
    // Mostrar modal de carga mientras se limpia y redirige
    Swal.fire({
      title: 'Cerrando sesión...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Limpiar datos
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("progreso");
    localStorage.removeItem("pruebaAprobada");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("cedula");

    // Forzar evento
    window.dispatchEvent(new Event('storage'));

    // Pequeña espera para que el usuario vea el spinner si todo es muy rápido
    await new Promise((res) => setTimeout(res, 600));

    // Cerrar loading y mostrar confirmación breve
    Swal.close();
    await Swal.fire({
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión exitosamente',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
      allowOutsideClick: false
    });

    // Redirigir
    navigate("/", { replace: true });
  }
};

  const handleNavToggle = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const handleNavLinkClick = () => {
    // Cierra el navbar al hacer clic en cualquier enlace
    setIsNavCollapsed(true);
  };

  // Cierra el navbar al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsNavCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm fixed-top" ref={navbarRef}>
      <div className="container">
        {/* LOGO + TEXTO CENTRAL */}
        <div className="navbar-brand-container d-flex align-items-center">
          <Link className="navbar-brand d-flex align-items-center me-0 me-md-3" to="/inicio" onClick={handleNavLinkClick}>
            <img
              src="/img/dhisve.png"
              alt="Logo DHISVE"
              className="navbar-logo"
              style={{ height: "100px", width: "auto" }}
            />
          </Link>
          
          <div className="navbar-center-text ms-2 ms-md-0">
            <span className="navbar-title d-none d-md-inline">
              PLATAFORMA INTERNA - DHISVE
            </span>
            <span className="navbar-title-mobile d-md-none">
              DHISVE
            </span>
            <div className="navbar-subtitle d-none d-lg-block">
              Capacitador - Talento Humano
            </div>
          </div>
        </div>

        {/* BOTÓN HAMBURGUESA - MODIFICADO */}
        <button
          className="navbar-toggler order-3 order-lg-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded={!isNavCollapsed ? "true" : "false"} // ⬅️ IMPORTANTE
          aria-label="Toggle navigation"
          onClick={handleNavToggle} // ⬅️ MANEJADOR PROPIO
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* MENÚ DE NAVEGACIÓN - CON CLASE DINÁMICA */}
        <div 
          className={`collapse navbar-collapse order-4 order-lg-3 ${!isNavCollapsed ? 'show' : ''}`} // ⬅️ CLASE DINÁMICA
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/inicio"
                onClick={handleNavLinkClick} // ⬅️ CIERRA AL HACER CLIC
              >
                <i className="bi bi-house-door d-lg-none me-2"></i>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/procesos"
                onClick={handleNavLinkClick}
              >
                <i className="bi bi-diagram-3 d-lg-none me-2"></i>
                Procesos
              </Link>
            </li>

            {/* MENÚ DESPLEGABLE EN MÓVIL */}
            <li className="nav-item d-lg-none">
              <Link 
                className="nav-link" 
                to="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout(e);
                }}
                style={{ color: '#dc3545' }} // Color rojo para "Salir"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Salir
              </Link>
            </li>
            
            {/* BOTÓN SALIR SOLO EN DESKTOP */}
            <li className="nav-item d-none d-lg-block">
              <Link 
                className="nav-link logout-link btn-logout-desktop" 
                to="/" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Salir
              </Link>
            </li>
          </ul>
        </div>

        {/* USUARIO INFO SOLO EN DESKTOP */}
        <div className="navbar-user-info d-none d-lg-flex align-items-center order-lg-4 ms-3">
          <div className="user-avatar me-2">
            <i className="bi bi-person-circle" style={{ fontSize: "1.5rem" }}></i>
          </div>
        </div>
      </div>
    </nav>
  );
}
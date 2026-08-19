import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DocumentosTalentoHumano from "./DocumentosTalentoHumano";

export default function AdminProcesoDashboard() {
  const { proceso_name } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("admin_proceso_token");
    const userData = localStorage.getItem("admin_proceso_user");
    
    if (!token || !userData) {
      navigate("/adminProceso");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.proceso_name !== proceso_name) {
        navigate("/adminProceso");
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error("Error:", error);
      navigate("/adminProceso");
    }
  }, [proceso_name, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_proceso_token");
    localStorage.removeItem("admin_proceso_user");
    navigate("/adminProceso");
  };

  if (!user) {
    return (
      <div className="text-center mt-5 pt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si el proceso es TALENTO HUMANO, mostrar documentos
  if (user.proceso_name === "Talento Humano") {
    return (
      <>
        <nav className="navbar navbar-dark bg-dark fixed-top">
          <div className="container-fluid">
            <span className="navbar-brand">
              👑 Panel de {user.proceso_name} - {user.username}
            </span>
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </nav>
        <DocumentosTalentoHumano />
      </>
    );
  }

  // Para otros procesos (si tienen otras funcionalidades)
  return (
    <>
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">
            👑 Panel de {user.proceso_name} - {user.username}
          </span>
          <button className="btn btn-outline-light" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <div className="container mt-5 pt-5 text-center">
        <h2>Bienvenido al panel de {user.proceso_name}</h2>
        <p className="text-muted">Módulo en desarrollo para este proceso</p>
      </div>
    </>
  );
}
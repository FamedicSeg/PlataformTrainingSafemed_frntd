import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginAdminProceso() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [proceso_name, setProceso_name] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [procesosList, setProcesosList] = useState([]);
  const [loadingProcesos, setLoadingProcesos] = useState(true);
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar procesos desde el backend al iniciar
  useEffect(() => {
    const fetchProcesos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/api/procesos`);
        if (!res.ok) throw new Error("Error al cargar procesos");
        
        const data = await res.json();
        if (data.success) {
          setProcesosList(data.data);
        } else {
          console.error("Error en respuesta de procesos:", data.message);
        }
      } catch (err) {
        console.error("Error cargando procesos:", err);
        // Si falla, usar lista estática como respaldo
        setProcesosList([
          "Dirección",
          "Ventas", 
          "Compras",
          "Desarrollo e Investigación",
          "Producción",
          "Control de Calidad",
          "Almacenamiento y Logística",
          "Aseguramiento de la Calidad y Seguridad",
          "Talento Humano",
          "Salud Ocupacional",
          "Seguridad Industrial"
        ]);
      } finally {
        setLoadingProcesos(false);
      }
    };

    fetchProcesos();
  }, [API_URL]);

  // Verificar si ya está autenticado
  useEffect(() => {
    const token = localStorage.getItem("admin_proceso_token");
    const userData = localStorage.getItem("admin_proceso_user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        // Redirigir al dashboard si ya está autenticado
        navigate(`/adminProcesoDashboard/${user.proceso_name}`);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("admin_proceso_token");
        localStorage.removeItem("admin_proceso_user");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validación básica
    if (!username.trim() || !password.trim() || !proceso_name) {
      setError("Todos los campos son obligatorios");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/api/login/procesos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password, 
          proceso_name 
        }),
      });

      // Leer respuesta como texto primero
      const text = await res.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Servidor devolvió una respuesta no válida: ${text.slice(0, 80)}...`);
      }

      // Verificar código HTTP
      if (!res.ok) {
        throw new Error(data.message || `Error de inicio de sesión (${res.status})`);
      }

      // Login exitoso - Validar estructura de respuesta
      if (!data.success) {
        throw new Error(data.message || "Error en la respuesta del servidor");
      }
      
      // Mostrar mensaje de éxito
      setError("");
      
      // Redirigir al dashboard del proceso específico
      navigate(`/adminProcesoDashboard/${data.user.proceso_name}`);
      
    } catch (err) {
      console.error("❌ Error en login:", err);
      setError(err.message || "Error desconocido al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="text-center mb-4">
          <h3 className="text-primary fw-bold">🔐 Acceso Administrador de Proceso</h3>
          <p className="text-muted">Acceso exclusivo para líderes de proceso</p>
        </div>
        
        {error && (
          <div className="alert alert-danger text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Usuario</label>
            <input
              type="text"
              className="form-control no-transform"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-3 position-relative">
            <label className="form-label fw-semibold">Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control no-transform"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-link position-absolute end-0 top-50"
              style={{ transform: "translateY(-50%)" }}
              disabled={loading}
            >
              {showPassword ? (
                <span title="Ocultar contraseña">🔒</span>
              ) : (
                <span title="Mostrar contraseña">🔍</span>
              )}
            </button>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">
              Selecciona el Proceso al que perteneces
            </label>
            <select
              className="form-select no-transform"
              value={proceso_name}
              onChange={(e) => setProceso_name(e.target.value)}
              disabled={loading || loadingProcesos}
              required
            >
              <option value="" disabled>
                {loadingProcesos ? "Cargando procesos..." : "-- Selecciona un Proceso --"}
              </option>
              {procesosList.map((proceso, index) => (
                <option key={index} value={proceso}>
                  {proceso}
                </option>
              ))}
            </select>
            {loadingProcesos && (
              <div className="mt-2">
                <small className="text-muted">
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Cargando lista de procesos...
                </small>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Verificando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
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
        // ✅ CORREGIDO: Eliminar el /api/ duplicado
        const res = await fetch(`${API_URL}/api/auth/procesos`);
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
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_proceso_user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        navigate(`/admin/${encodeURIComponent(user.proceso_name)}`);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_proceso_user");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password.trim() || !proceso_name) {
      setError("Todos los campos son obligatorios");
      setLoading(false);
      return;
    }

    try {
      // ✅ CORREGIDO: URL correcta
      const loginUrl = `${API_URL}/api/auth/login/procesos`;
      console.log("🔍 Intentando login a:", loginUrl);
      
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password, 
          proceso_name 
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error de inicio de sesión");
      }
      
      // Guardar token y datos del usuario
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
      } else {
        localStorage.setItem("admin_token", "temp_token_" + Date.now());
      }
      localStorage.setItem("admin_proceso_user", JSON.stringify(data.user));
      
      console.log("✅ Login exitoso");
      console.log("   Usuario:", data.user.username);
      console.log("   Proceso:", data.user.proceso_name);
      
      // Redirigir al dashboard
      navigate(`/admin/${encodeURIComponent(data.user.proceso_name)}`);
      
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-link position-absolute end-0 top-50"
              style={{ transform: "translateY(-50%)" }}
              disabled={loading}
            >
              {showPassword ? "🔒" : "🔍"}
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
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
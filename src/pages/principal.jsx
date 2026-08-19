import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import "../styles/pages/principal.css";

export default function LoginNombre() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cedula: permitir solo dígitos
  const sanitizeDigitsOnly = (value) => String(value || "").replace(/\D+/g, "");

  const handleCedulaChange = (e) => {
    setUser(sanitizeDigitsOnly(e.target.value));
  };

  const handleCedulaPaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text") || "";
    setUser(sanitizeDigitsOnly(paste));
  };

  const handlePasswordChange = (e) => {
    setPassword(sanitizeDigitsOnly(e.target.value));
  };
  const handlePasswordPaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text") || "";
    setPassword(sanitizeDigitsOnly(String(paste).replace(/\r|\n/g, "")));
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!user || user.length < 4) {
      return alert("Ingresa una cédula válida (solo números).");
    }
    if (!password || password.length < 3) {
      return alert("Ingresa la contraseña.");
    }

    setLoading(true);

    try {
      // Limpiar datos anteriores
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("progreso");
      localStorage.removeItem("pruebaAprobada");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user_token");

      console.log("🔄 Iniciando proceso de login...");

      // Enviar al backend con cedula + password
      const res = await fetch(`${API_URL}/api/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: user, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        
        if (res.status === 401) {
          alert("Cédula o contraseña incorrectos");
        } else if (res.status === 400) {
          alert(err.message || "Datos incompletos");
        } else {
          alert(err.message || "Error en el servidor. Intente más tarde.");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("✅ Login exitoso, datos recibidos:", data);

      // Guardar TODAS las claves necesarias para ProtectedUserRoute
      
      // 1. Token JWT
      localStorage.setItem("token", data.token);
      
      // 2. Clave "user_token" que busca ProtectedUserRoute
      localStorage.setItem("user_token", data.token);
      
      // 3. Clave "isLoggedIn" CORRECTA
      localStorage.setItem("isLoggedIn", "true");
      
      // 4. Datos del usuario
      localStorage.setItem("usuario", data.usuario.nombre);
      localStorage.setItem("progreso", data.usuario.progreso ?? 0);
      
      // Guardar si ya aprobó la prueba
      const pruebaFlag = data.usuario.prueba_aprobada ?? data.usuario.pruebaAprobada ?? 0;
      localStorage.setItem("pruebaAprobada", pruebaFlag ? "true" : "false");

      // Datos adicionales
      if (data.usuario.id) {
        localStorage.setItem("userId", data.usuario.id);
      }
      if (data.usuario.cedula) {
        localStorage.setItem("cedula", data.usuario.cedula);
      }

      console.log("📦 Datos guardados en localStorage:");
      console.log("   user_token:", localStorage.getItem("user_token"));
      console.log("   isLoggedIn:", localStorage.getItem("isLoggedIn"));
      console.log("   token:", localStorage.getItem("token"));
      console.log("   usuario:", localStorage.getItem("usuario"));

      // Forzar evento de storage para que App.jsx lo detecte
      window.dispatchEvent(new Event('storage'));

      // ESPERAR UN MOMENTO Y LUEGO REDIRIGIR
      setTimeout(() => {
        console.log("🔄 Redirigiendo a /inicio...");
        // USAR window.location para forzar recarga completa
        window.location.href = "/inicio";
      }, 100);

    } catch (error) {
      console.error("❌ Error en login:", error);
      alert("Error de conexión. Verifique su internet e intente nuevamente.");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="container-fluid container-pr mt-5">

      {/* Bienvenida */}
      <div className="text-center mb-4">
        <h3 className="bienvenida-titulo">PLATAFORMA INTERNA - DHISVE</h3>
        <h3 className="bienvenida-subtitulo">Bienvenido</h3>
        <p className="instruccion-texto">Ingresa tu cédula de identidad para continuar.</p>
        <h5 className="instruccion-texto2">Nota: Tu cédula de identidad también es tu contraseña </h5>
      </div>

      {/* Formulario */}
      <div className="formulario-container">
        <div className="row g-3">
          
          <div className="col-md-6">
            <input 
              type="text" 
              className="form-control-custom" 
              placeholder="Cédula de identidad"
              value={user}
              onChange={handleCedulaChange}
              onPaste={handleCedulaPaste}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          
          <div className="col-md-6 position-relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-control-custom" 
              placeholder="Contraseña"
              value={password}
              onChange={handlePasswordChange}
              onPaste={handlePasswordPaste}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <span 
              onClick={() => !loading && setShowPassword(!showPassword)}
              className="toggle-password"
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "18px",
                opacity: loading ? 0.5 : 1
              }}
            >
              {showPassword ? "🔒" : "🔍"}
            </span>
          </div>
          
          <div className="col-12 text-center mt-4">
            <button 
              className="btn-continuar" 
              onClick={handleLogin}
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Cargando..." : "Acceder"}
            </button>
          </div>

          <div className="botones-container">
            <button
              className="btn-adminProceso"
              onClick={() => navigate("/admin/procesos")}
            >
              ADMIN. PROCESOS
            </button>

            <button
              className="btn-adminPrincipal"
              onClick={() => navigate("/admin")}
            >
              ADMIN. PRINCIPAL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
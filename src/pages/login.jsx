import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
        const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

  // Si la respuesta no es JSON (por ejemplo, HTML de error), atrapamos el caso
  const text = await res.text(); // leemos el cuerpo como texto

  let data;
  try {
    data = JSON.parse(text); // intentamos convertirlo a JSON
  } catch {
    throw new Error(`Servidor devolvió una respuesta no válida: ${text.slice(0, 80)}...`);
  }

  // ⚠️ Verificamos el código HTTP
  if (!res.ok) {
    throw new Error(data.message || `Error de inicio de sesión (${res.status})`);
  }

  // Login exitoso
  localStorage.setItem("admin_token", data.token);
  navigate("/adminTTHH");
} catch (err) {
  console.error("❌ Error en login:", err);
  setError(err.message);
}

  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h3 className="text-center mb-4 text-primary fw-bold">🔐 Acceso Administrador</h3>
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control no-transform"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type={showPassword ? "text": "password"}
              className="form-control no-transform"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Botón mostrar/ocultar */}
            <span 
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password"
            style={{
              position: "absolute",
              right: "10px",
              top: "77%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "18px",
            }}
            >
              {showPassword ? (
                <span title="Ocultar contraseña">🔒</span>
              ) : (
                <span title="Mostrar contraseña">🔍</span>
              )}
              </span>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

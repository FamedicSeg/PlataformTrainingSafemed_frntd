import { useEffect, useMemo, useState } from "react";
import { Search, Plus, MoreVertical, Mail, Shield, UserX } from "lucide-react";
import Sidebar from "./sidebar";
import "../styles/pages/globals.css";

export default function AdminPrincipal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("usuarios"); // Estado para la vista activa

  // ✅ usuarios desde DB
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_URL}/api/usuarios/load`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // credentials: "include", // úsalo si manejas cookies/sesión
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Error ${res.status}: ${txt}`);
        }

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        setErrorMsg("No se pudieron cargar los usuarios. Revisa tu API.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (API_URL) fetchUsers();
    else {
      setLoading(false);
      setErrorMsg("Falta configurar VITE_API_URL en tu frontend.");
    }
  }, [API_URL]);

  // ✅ Filtrado (igual que tenías)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const nombre = (user.nombre || "").toLowerCase();
      const cedula_identidad = (user.cedula_identidad || "").toLowerCase(); 
      const term = searchTerm.toLowerCase();

      return nombre.includes(term) || cedula_identidad.includes(term);
    });
  }, [users, searchTerm]);

  return (
    <div className="admin-layout">
      <Sidebar onNavigate={setActiveView} activeView={activeView} />
      <main className="main-content">
        {activeView === 'usuarios' && (
          <div className="admin-users">
            {/* Header */}
            <div className="admin-users-header">
              <div>
                <h1>EMPLEADOS DHISVE</h1>
                <p>Administra los empleados de tu plataforma</p>
              </div>

              <button className="btn-new-user">
                <Plus className="w-5 h-5" />
                Nuevo Usuario
              </button>
            </div>

            {/* Filtros */}
            <div className="filters-card">
              <div className="search-wrap">
                <div className="search-icon">
                  <Search />
                  <input
                    type="text"
                    placeholder="Busca por Nombre o Cédula de Identidad"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-field"
                  />
                </div>
              </div>
            </div>

            {/* Estados */}
            {loading && (
              <div className="state-card">
                Cargando usuarios...
              </div>
            )}

            {!loading && errorMsg && (
              <div className="state-card error">
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && filteredUsers.length === 0 && (
              <div className="state-card">
                No hay usuarios para mostrar.
              </div>
            )}

            {/* Tabla */}
            {!loading && !errorMsg && filteredUsers.length > 0 && (
              <div className="table-card">
                <div className="table-scroll">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Cédula de Identidad</th>
                        <th>Proceso</th>
                        <th>Cargo</th>
                        <th>Empresa</th>
                        <th>Fecha de Registro</th>
                      </tr>
                    </thead>

                    <tbody>
  {filteredUsers.map((user) => (
    <tr key={user.id}>
      {/* ✅ Columna: Usuario */}
      <td>
        <div className="user-cell">
          <div className="user-avatar">
            <span>
              {(user.nombre || "U")
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="user-name">{user.nombre}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
      </td>

      {/* ✅ Columna: Cédula */}
      <td>
        {user.cedula_identidad || "N/A"}
      </td>

      {/* ✅ Columna: Proceso */}
      <td>
        {user.proceso || "N/A"}
      </td>

      {/* ✅ Columna: Cargo */}
      <td>
        {user.cargo || "N/A"}
      </td>

      {/* ✅ Columna: Empresa */}
      <td>
        {user.empresa_socio || "N/A"}
      </td>

      {/* ✅ Columna: Fecha Registro */}
      <td>
        {user.fecha_registro
          ? new Date(user.fecha_registro).toLocaleDateString("es-EC")
          : "N/A"}
      </td>
    </tr>
  ))}
</tbody>


                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {activeView === 'Talento Humano' && <div>Contenido de Talento Humano</div>}
        {activeView === 'Control de Calidad' && <div>Contenido de Control de Calidad</div>}
        {activeView === 'Dirección' && <div>Contenido de Dirección</div>}
        {activeView === 'Aseguramiento de la Calidad' && <div>Contenido de Aseguramiento de la Calidad</div>}
        {activeView === 'Resultados' && <div>Contenido de Resultados</div>}
      </main>
    </div>
  );
}

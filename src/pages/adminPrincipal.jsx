import { useEffect, useMemo, useState } from "react";
import { Search, Shield, Users, LogOut, Key, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import '../styles/pages/adminPrincipal.css';


export default function AdminPrincipal() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [activeTab, setActiveTab] = useState("usuarios");

  // ── Empleados ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Admin Procesos ─────────────────────────────────────────────
  const [adminProcesos, setAdminProcesos] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [searchAdmin, setSearchAdmin] = useState("");
  const [reseteando, setReseteando] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setErrorMsg("");
        const res = await fetch(`${API_URL}/api/usuarios/load`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setErrorMsg("No se pudieron cargar los usuarios.");
      } finally {
        setLoadingUsers(false);
      }
    };
    if (API_URL) fetchUsers();
    else { setLoadingUsers(false); setErrorMsg("Falta configurar VITE_API_URL."); }
  }, [API_URL]);

  // Cargar adminProcesos al cambiar de pestaña
  useEffect(() => {
    if (activeTab === 'admin-procesos') cargarAdminProcesos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const cargarAdminProcesos = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/admin-procesos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setAdminProcesos(data.data || []);
      else setAdminProcesos([]);
    } catch { setAdminProcesos([]); }
    finally { setLoadingAdmins(false); }
  };

  const resetearPassword = async (admin) => {
    const { value: newPassword } = await Swal.fire({
      title: 'Resetear contraseña',
      html: `<b>${admin.nombre}</b><br><small class="text-muted">${admin.proceso_name}</small>`,
      input: 'password',
      inputLabel: 'Contraseña provisional (mín. 6 caracteres)',
      inputPlaceholder: 'Nueva contraseña...',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Establecer',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) return 'Mínimo 6 caracteres';
      },
    });
    if (!newPassword) return;

    setReseteando(admin.id);
    try {
      const res = await fetch(
        `${API_URL}/api/auth/admin/admin-procesos/${admin.id}/reset-password`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ newPassword }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        Swal.fire('✅ Listo', `Contraseña provisional establecida para <b>${admin.nombre}</b>.<br>El admin deberá cambiarla en su próximo ingreso.`, 'success');
        cargarAdminProcesos();
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setReseteando(null);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('admin_token');
        navigate('/admin');
      }
    });
  };

  // ── Filtros ────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const nombre = (user.nombre || "").toLowerCase();
      const cedula_identidad = (user.cedula_identidad || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return nombre.includes(term) || cedula_identidad.includes(term);
    });
  }, [users, searchTerm]);

  const filteredAdmins = useMemo(() => {
    const term = searchAdmin.toLowerCase();
    return adminProcesos.filter(a =>
      (a.nombre || '').toLowerCase().includes(term) ||
      (a.proceso_name || '').toLowerCase().includes(term) ||
      (a.cedula || '').includes(term)
    );
  }, [adminProcesos, searchAdmin]);
  const navItems = [
    { id: 'usuarios',       label: 'Empleados',        icon: Users  },
    { id: 'admin-procesos', label: 'Admin Procesos',   icon: Shield },
  ];

  const tabTitles = {
    'usuarios':       'Empleados DHISVE',
    'admin-procesos': 'Administradores de Proceso',
  };

  return (
    <div className="aph-layout">

      {/* ── Sidebar ── */}
      <aside className="aph-sidebar">
        <div className="aph-brand">
          <div className="aph-brand-logo">AP</div>
          <div>
            <div className="aph-brand-name">SafeNova</div>
            <div className="aph-brand-tagline">Admin Principal</div>
          </div>
        </div>

        <nav className="aph-nav">
          <div className="aph-nav-section-label">MENÚ PRINCIPAL</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`aph-nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="aph-nav-icon"><item.icon size={17} /></span>
              <span className="aph-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="aph-sidebar-footer">
          <div className="aph-sidebar-user">
            <div className="aph-user-avatar">A</div>
            <div className="aph-user-info">
              <div className="aph-user-name">Administrador</div>
              <div className="aph-user-role">Admin Principal</div>
            </div>
          </div>
          <button className="aph-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="aph-main">
        <header className="aph-header">
          <div className="aph-header-left">
            <div className="aph-breadcrumb">Admin Principal <span>›</span> {tabTitles[activeTab]}</div>
            <h1 className="aph-header-title">{tabTitles[activeTab]}</h1>
          </div>
        </header>

        <main className="aph-content">

          {/* ── Empleados ── */}
          {activeTab === 'usuarios' && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              {/* Buscador */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o cédula..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                  />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{filteredUsers.length} resultado(s)</span>
              </div>

              {loadingUsers && <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>}
              {!loadingUsers && errorMsg && <div className="alert alert-danger m-3">{errorMsg}</div>}
              {!loadingUsers && !errorMsg && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th>Usuario</th>
                        <th>Cédula</th>
                        <th>Proceso</th>
                        <th>Cargo</th>
                        <th>Empresa</th>
                        <th>Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">No hay empleados para mostrar.</td></tr>
                      ) : filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center',justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                                {(user.nombre || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{user.nombre}</div>
                                {user.email && <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{user.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td>{user.cedula_identidad || '—'}</td>
                          <td>{user.proceso || '—'}</td>
                          <td>{user.cargo || '—'}</td>
                          <td>{user.empresa_socio || '—'}</td>
                          <td>{user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-EC') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Admin Procesos ── */}
          {activeTab === 'admin-procesos' && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              {/* Buscador + Refrescar */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, proceso o cédula..."
                    value={searchAdmin}
                    onChange={e => setSearchAdmin(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                  />
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={cargarAdminProcesos} title="Refrescar">
                  <RefreshCw size={14} />
                </button>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{filteredAdmins.length} admin(s)</span>
              </div>

              {loadingAdmins && <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>}
              {!loadingAdmins && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light2">
                      <tr className="table-header2">
                        <th>Nombre</th>
                        <th>Cédula</th>
                        <th>Proceso</th>
                        <th>Estado</th>
                        <th>Primer login</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">No hay administradores de proceso registrados.</td></tr>
                      ) : filteredAdmins.map(admin => (
                        <tr key={admin.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                                {(admin.nombre || 'A')[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{admin.nombre}</span>
                            </div>
                          </td>
                          <td>{admin.cedula || '—'}</td>
                          <td>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600 }}>
                              {admin.proceso_name}
                            </span>
                          </td>
                          <td>
                            {admin.activo
                              ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600 }}>Activo</span>
                              : <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600 }}>Inactivo</span>
                            }
                          </td>
                          <td>
                            {admin.primer_login
                              ? <span style={{ background: '#fef9c3', color: '#a16207', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600 }}>Pendiente</span>
                              : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem' }}>Completado</span>
                            }
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => resetearPassword(admin)}
                              disabled={reseteando === admin.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
                            >
                              {reseteando === admin.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : <Key size={13} />
                              }
                              Resetear contraseña
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

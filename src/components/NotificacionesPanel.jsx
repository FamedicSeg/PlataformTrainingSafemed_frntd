import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Trash2, Check, UserCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/NotificacionesPanel.css';

export default function NotificacionesPanel({ tipo }) {
  const API_URL = import.meta.env.VITE_API_URL;
  
  // El tipo viene del contexto donde se muestra el panel, para no mezclar sesiones
  const adminToken = localStorage.getItem("admin_token");
  const userToken = localStorage.getItem("user_token");
  const isAdmin = tipo ? tipo === 'admin' : !!adminToken;
  const token = isAdmin ? adminToken : userToken;

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) return;
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(intervalo);
  }, [token]);

  const cargarNotificaciones = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/notificaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setNotificaciones(data.data || []);
        const noLeidas = (data.data || []).filter(n => !n.leida).length;
        setNoLeidas(noLeidas);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    if (!token) return;
    try {
      const response = await fetch(
        `${API_URL}/api/notificaciones/${notificacionId}/marcar-leida`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        cargarNotificaciones();
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const eliminarNotificacion = async (notificacionId) => {
    if (!token) return;
    try {
      const response = await fetch(
        `${API_URL}/api/notificaciones/${notificacionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        cargarNotificaciones();
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    if (!token) return;
    try {
      setCargando(true);
      const response = await fetch(
        `${API_URL}/api/notificaciones/marcar-todas-leidas/todas`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        cargarNotificaciones();
      }
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error);
    } finally {
      setCargando(false);
    }
  };

  const eliminarTodasNotificaciones = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar todas las notificaciones?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      });

      if (!result.isConfirmed) return;

      setCargando(true);
      const response = await fetch(
        `${API_URL}/api/notificaciones/eliminar-todas/todas`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        cargarNotificaciones();
        setMostrarDropdown(false);
      }
    } catch (error) {
      console.error('Error eliminando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    const now = new Date();
    const notifDate = new Date(fecha);
    const diff = now - notifDate;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;

    return notifDate.toLocaleDateString('es-ES');
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'aprobado':
        return <CheckCircle size={20} className="icon-aprobado" />;
      case 'rechazado':
        return <AlertCircle size={20} className="icon-rechazado" />;
      case 'asignado':
        return <UserCheck size={20} className="icon-asignado" />;
      default:
        return <Bell size={20} />;
    }
  };

  if (!token) return null;

  return (
    <div className="notificaciones-panel">
      <div className="campana-container">
        <button
          className="btn-campana"
          onClick={() => setMostrarDropdown(!mostrarDropdown)}
          title="Notificaciones"
        >
          <Bell size={24} />
          {noLeidas > 0 && (
            <span className="badge-notificaciones">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {mostrarDropdown && (
          <div className="dropdown-notificaciones">
            <div className="dropdown-header">
              <h4>🔔 Notificaciones</h4>
              {noLeidas > 0 && (
                <button
                  className="btn-marcar-leidas"
                  onClick={marcarTodasLeidas}
                  disabled={cargando}
                >
                  <Check size={16} /> Marcar todas
                </button>
              )}
            </div>

            <div className="notificaciones-lista">
              {notificaciones.length === 0 ? (
                <div className="sin-notificaciones">
                  <Bell size={40} />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notificacion-item ${notif.tipo} ${!notif.leida ? 'no-leida' : ''}`}
                  >
                    <div className="notificacion-icon">
                      {getIconoTipo(notif.tipo)}
                    </div>

                    <div className="notificacion-content">
                      <p className="notificacion-mensaje">{notif.mensaje}</p>
                      
                      {notif.razon_rechazo && (
                        <div className="razon-rechazo">
                          <strong>Razón del rechazo:</strong>
                          <p>{notif.razon_rechazo}</p>
                        </div>
                      )}
                      
                      <small className="notificacion-fecha">
                        {formatearFecha(notif.creada_en)}
                      </small>
                    </div>

                    <div className="notificacion-acciones">
                      {!notif.leida && (
                        <button
                          className="btn-marcar"
                          onClick={() => marcarComoLeida(notif.id)}
                          title="Marcar como leída"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className="btn-eliminar"
                        onClick={() => eliminarNotificacion(notif.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notificaciones.length > 0 && (
              <div className="dropdown-footer">
                <button
                  className="btn-eliminar-todas"
                  onClick={eliminarTodasNotificaciones}
                  disabled={cargando}
                >
                  Eliminar todas
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

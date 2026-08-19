import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Trash2, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/NotificacionesPanel.css';

export default function NotificacionesPanel() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 2000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notificaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotificaciones(data.data || []);
        
        // Contar notificaciones no leídas
        const noLeidas = (data.data || []).filter(n => !n.leida).length;
        setNoLeidas(noLeidas);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
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

  return (
    <div className="notificaciones-panel">
      {/* Botón campana */}
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

        {/* Dropdown de notificaciones */}
        {mostrarDropdown && (
          <div className="dropdown-notificaciones">
            <div className="dropdown-header">
              <h4> 🔔 Notificaciones</h4>
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

            {/* Lista de notificaciones */}
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
                      {notif.tipo === 'aprobado' ? (
                        <CheckCircle size={20} className="icon-aprobado" />
                      ) : (
                        <AlertCircle size={20} className="icon-rechazado" />
                      )}
                    </div>

                    <div className="notificacion-content">
                      <p className="notificacion-mensaje">{notif.mensaje}</p>
                      
                      {notif.razon_rechazo && (
                        <div className="razon-rechazo">
                          <strong>Razón:</strong> {notif.razon_rechazo}
                        </div>
                      )}

                      <span className="notificacion-fecha">
                        {formatearFecha(notif.creada_en)}
                      </span>
                    </div>

                    <div className="notificacion-acciones">
                      {!notif.leida && (
                        <button
                          className="btn-accion btn-marcar"
                          onClick={() => marcarComoLeida(notif.id)}
                          title="Marcar como leída"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className="btn-accion btn-eliminar"
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

            {/* Footer */}
            {notificaciones.length > 0 && (
              <div className="dropdown-footer">
                <button
                  className="btn-eliminar-todas"
                  onClick={eliminarTodasNotificaciones}
                  disabled={cargando}
                >
                  <Trash2 size={14} /> Eliminar todas
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

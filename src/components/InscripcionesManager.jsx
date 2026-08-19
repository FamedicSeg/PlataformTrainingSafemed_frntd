import { useState, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import Swal from 'sweetalert2';

/**
 * InscripcionesManager - Gestor de inscripciones en un curso
 * 
 * Props:
 *   - cursoId: ID del curso
 *   - onClose: callback para cerrar
 */
export default function InscripcionesManager({ cursoId, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  // Cargar inscripciones
  useEffect(() => {
    cargarInscripciones();
  }, [cursoId]);

  const cargarInscripciones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/inscripciones/curso/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setInscripciones(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (inscripcionId, nuevoEstado) => {
    try {
      const response = await fetch(`${API_URL}/api/inscripciones/${inscripcionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire('Éxito', 'Estado actualizado', 'success');
      cargarInscripciones();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleEliminarInscripcion = (inscripcion) => {
    Swal.fire({
      title: '¿Desuscribir usuario?',
      text: `Se desuscribirá a ${inscripcion.usuario_nombre} de este curso`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, desuscribir',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error('Error al eliminar');

          Swal.fire('Eliminado', 'Usuario desuscrito', 'success');
          cargarInscripciones();
        } catch (error) {
          Swal.fire('Error', error.message, 'error');
        }
      }
    });
  };

  const inscripcionesFiltradas = estadoFiltro === 'todos'
    ? inscripciones
    : inscripciones.filter(i => i.estado === estadoFiltro);

  const estadoColores = {
    'no iniciado': 'secondary',
    'en progreso': 'warning',
    'completado': 'success'
  };

  const estadoIconos = {
    'no iniciado': '⭕',
    'en progreso': '🔄',
    'completado': '✅'
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999
    }}>
      <div className="card" style={{ maxWidth: '1000px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Inscripciones del Curso</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="card-body">
          {/* Filtros */}
          <div className="mb-3">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${estadoFiltro === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setEstadoFiltro('todos')}
              >
                Todos ({inscripciones.length})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === 'no iniciado' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setEstadoFiltro('no iniciado')}
              >
                No Iniciado ({inscripciones.filter(i => i.estado === 'no iniciado').length})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === 'en progreso' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setEstadoFiltro('en progreso')}
              >
                En Progreso ({inscripciones.filter(i => i.estado === 'en progreso').length})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === 'completado' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setEstadoFiltro('completado')}
              >
                Completado ({inscripciones.filter(i => i.estado === 'completado').length})
              </button>
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="alert alert-info text-center mb-0">
              No hay inscripciones para mostrar
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Estudiante</th>
                    <th>Cédula</th>
                    <th>Estado</th>
                    <th>Fecha Inscripción</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripcionesFiltradas.map(inscripcion => (
                    <tr key={inscripcion.id}>
                      <td>
                        <div className="fw-semibold">{inscripcion.usuario_nombre}</div>
                      </td>
                      <td>
                        <code>{inscripcion.cedula_identidad}</code>
                      </td>
                      <td>
                        <span className={`badge bg-${estadoColores[inscripcion.estado]}`}>
                          {estadoIconos[inscripcion.estado]} {inscripcion.estado}
                        </span>
                      </td>
                      <td>
                        <small>
                          {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          {inscripcion.estado !== 'en progreso' && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleCambiarEstado(inscripcion.id, 'en progreso')}
                              title="Marcar en progreso"
                            >
                              ▶️ En Progreso
                            </button>
                          )}
                          {inscripcion.estado !== 'completado' && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleCambiarEstado(inscripcion.id, 'completado')}
                              title="Marcar completado"
                            >
                              <Check size={16} className="me-1" />
                              Completado
                            </button>
                          )}
                          <button
                            className="btn btn-danger"
                            onClick={() => handleEliminarInscripcion(inscripcion)}
                            title="Eliminar inscripción"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

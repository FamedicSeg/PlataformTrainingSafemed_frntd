import { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';

/**
 * AsignarUsuariosModal - Modal para asignar usuarios a un curso
 * 
 * Props:
 *   - cursoId: ID del curso
 *   - onClose: callback para cerrar
 *   - onAssign: callback cuando se asigna usuario
 */
export default function AsignarUsuariosModal({ cursoId, onClose, onAssign }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [estado, setEstado] = useState('no iniciado');

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, [cursoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      console.log('🔍 Iniciando carga de datos...');
      console.log('API_URL:', API_URL);
      console.log('cursoId:', cursoId);
      console.log('token:', token ? 'existe' : 'no existe');

      // Cargar todos los usuarios
      console.log('📥 Fetching usuarios desde:', `${API_URL}/api/cursos/debug/usuarios`);
      const usuariosRes = await fetch(`${API_URL}/api/cursos/debug/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Usuarios response status:', usuariosRes.status);
      const usuariosData = await usuariosRes.json();
      console.log('Usuarios data:', usuariosData);
      
      if (!usuariosRes.ok) {
        throw new Error(`Error en usuarios: ${usuariosData.message || usuariosRes.status}`);
      }
      
      setUsuarios(usuariosData.data || []);

      // Cargar inscripciones actuales del curso
      console.log('📥 Fetching inscripciones desde:', `${API_URL}/api/inscripciones/curso/${cursoId}`);
      const inscripcionesRes = await fetch(`${API_URL}/api/inscripciones/curso/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Inscripciones response status:', inscripcionesRes.status);
      const inscripcionesData = await inscripcionesRes.json();
      console.log('Inscripciones data:', inscripcionesData);
      
      if (!inscripcionesRes.ok) {
        throw new Error(`Error en inscripciones: ${inscripcionesData.message || inscripcionesRes.status}`);
      }
      
      setUsuariosAsignados(inscripcionesData.data || []);
      console.log('✅ Datos cargados exitosamente');

    } catch (error) {
      console.error('❌ Error completo:', error);
      Swal.fire('Error', `No se pudieron cargar los datos: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedUser) {
      Swal.fire('Error', 'Selecciona un usuario', 'error');
      return;
    }

    // Verificar que no esté ya asignado
    if (usuariosAsignados.some(u => u.usuario_id === selectedUser.id)) {
      Swal.fire('Error', 'Este usuario ya está asignado al curso', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/inscripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: selectedUser.id,
          curso_id: cursoId,
          estado: estado
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire('Éxito', `Usuario "${selectedUser.nombre}" asignado al curso`, 'success');
      setSelectedUser(null);
      cargarDatos();
      
      if (onAssign) onAssign();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleEliminar = async (inscripcionId) => {
    const result = await Swal.fire({
      title: '¿Eliminar asignación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/inscripciones/${inscripcionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error al eliminar');

        Swal.fire('Eliminado', 'Inscripción eliminada', 'success');
        cargarDatos();

      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  // Filtrar usuarios no asignados
  const usuariosDisponibles = usuarios.filter(u =>
    !usuariosAsignados.some(a => a.usuario_id === u.id) &&
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="card" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">👥 Asignar Usuarios al Curso</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {/* Panel de asignación */}
              <div className="col-lg-6">
                <h6 className="mb-3">📝 Asignar Nuevo Usuario</h6>
                
                {/* Búsqueda */}
                <div className="input-group mb-3">
                  <span className="input-group-text">🔍</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Lista de usuarios disponibles */}
                <div className="list-group mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {usuariosDisponibles.length === 0 ? (
                    <div className="alert alert-info mb-0">
                      No hay usuarios disponibles o todos están asignados
                    </div>
                  ) : (
                    usuariosDisponibles.map(usuario => (
                      <button
                        key={usuario.id}
                        className={`list-group-item list-group-item-action text-start ${
                          selectedUser?.id === usuario.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedUser(usuario)}
                      >
                        <div>
                          <strong>{usuario.nombre}</strong>
                          <p className="mb-0 small text-muted">
                            Cédula: {usuario.cedula_identidad}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Estado */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Estado Inicial</label>
                  <select
                    className="form-select"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="no iniciado">⭕ No iniciado</option>
                    <option value="en progreso">🔄 En progreso</option>
                    <option value="completado">✅ Completado</option>
                  </select>
                </div>

                {/* Botón asignar */}
                <button
                  className="btn btn-primary w-100"
                  onClick={handleAsignar}
                  disabled={!selectedUser}
                >
                  <Plus size={18} className="me-2" />
                  Asignar Usuario
                </button>
              </div>

              {/* Panel de usuarios asignados */}
              <div className="col-lg-6">
                <h6 className="mb-3">✅ Usuarios Asignados ({usuariosAsignados.length})</h6>

                <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {usuariosAsignados.length === 0 ? (
                    <div className="alert alert-info mb-0">
                      No hay usuarios asignados aún
                    </div>
                  ) : (
                    usuariosAsignados.map(inscripcion => (
                      <div
                        key={inscripcion.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{inscripcion.usuario_nombre}</strong>
                          <p className="mb-0 small text-muted">
                            Cédula: {inscripcion.cedula_identidad}
                          </p>
                          <small>
                            Estado:
                            <span className={`badge bg-${
                              inscripcion.estado === 'no iniciado' ? 'secondary' :
                              inscripcion.estado === 'en progreso' ? 'warning' :
                              'success'
                            } ms-1`}>
                              {inscripcion.estado}
                            </span>
                          </small>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleEliminar(inscripcion.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

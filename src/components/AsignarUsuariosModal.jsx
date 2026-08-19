import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Users, CheckSquare, Square, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/pages/asignarUsuariosModal.css';

// AsignarUsuariosModal - Modal para asignar usuarios a un curso

export default function AsignarUsuariosModal({ cursoId, onClose, onAssign }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]); // ✅ Usuarios a asignar
  const [selectedAssigned, setSelectedAssigned] = useState([]); // ✅ Usuarios asignados seleccionados para eliminar
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
      console.log('Datos cargados exitosamente');

      // Limpiar selecciones después de cargar
      setSelectedUsers([]);
      setSelectedAssigned([]);

    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire('Error', `No se pudieron cargar los datos: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtrar usuarios no asignados
  const usuariosDisponibles = usuarios.filter(u => {
    // 1. Verificar que no esté asignado
    const yaAsignado = usuariosAsignados.some(a => a.usuario_id === u.id);
    if (yaAsignado) return false;

    // 2. Si no hay término de búsqueda, mostrar todos los disponibles
    if (!searchTerm.trim()) return true;

    // 3. Buscar en nombre o proceso
    const termino = searchTerm.toLowerCase().trim();
    const nombre = (u.nombre || '').toLowerCase();
    const proceso = (u.proceso || '').toLowerCase();

    // ✅ Retornar si coincide en nombre o proceso
    return nombre.includes(termino) || proceso.includes(termino);
  });

  // ✅ Seleccionar un usuario individual (para asignar)
  const handleSelectUser = (usuario) => {
    setSelectedUsers(prev => {
      const existe = prev.some(u => u.id === usuario.id);
      if (existe) {
        return prev.filter(u => u.id !== usuario.id);
      } else {
        return [...prev, usuario];
      }
    });
  };

  // ✅ Seleccionar TODOS los usuarios disponibles
  const handleSelectAll = () => {
    const disponibles = usuariosDisponibles;
    const yaSeleccionados = selectedUsers.map(u => u.id);
    const nuevos = disponibles.filter(u => !yaSeleccionados.includes(u.id));
    
    if (nuevos.length === 0) {
      // Si todos ya están seleccionados, deseleccionar todos
      setSelectedUsers([]);
    } else {
      setSelectedUsers(prev => [...prev, ...nuevos]);
    }
  };

  // ✅ Verificar si todos los disponibles están seleccionados
  const todosSeleccionados = () => {
    if (usuariosDisponibles.length === 0) return false;
    const idsDisponibles = usuariosDisponibles.map(u => u.id);
    const idsSeleccionados = selectedUsers.map(u => u.id);
    return idsDisponibles.every(id => idsSeleccionados.includes(id));
  };

  // ✅ Seleccionar por proceso (desde el buscador)
  const handleSelectByProcess = () => {
    if (!searchTerm.trim()) {
      Swal.fire('Info', 'Escribe un proceso para buscar', 'info');
      return;
    }

    const termino = searchTerm.toLowerCase().trim();
    const usuariosPorProceso = usuariosDisponibles.filter(u => {
      const proceso = (u.proceso || '').toLowerCase();
      return proceso.includes(termino);
    });

    if (usuariosPorProceso.length === 0) {
      Swal.fire('Info', `No se encontraron usuarios con el proceso "${searchTerm}"`, 'info');
      return;
    }

    const idsSeleccionados = selectedUsers.map(u => u.id);
    const nuevos = usuariosPorProceso.filter(u => !idsSeleccionados.includes(u.id));
    
    if (nuevos.length === 0) {
      Swal.fire('Info', 'Todos los usuarios de este proceso ya están seleccionados', 'info');
      return;
    }

    setSelectedUsers(prev => [...prev, ...nuevos]);
    Swal.fire('Éxito', `Se seleccionaron ${nuevos.length} usuarios del proceso "${searchTerm}"`, 'success');
  };

  // ✅ ============================================
  // ✅ FUNCIONES PARA ELIMINAR MÚLTIPLES
  // ✅ ============================================

  // ✅ Seleccionar/Deseleccionar un usuario asignado para eliminar
  const handleSelectAssigned = (inscripcion) => {
    setSelectedAssigned(prev => {
      const existe = prev.some(a => a.id === inscripcion.id);
      if (existe) {
        return prev.filter(a => a.id !== inscripcion.id);
      } else {
        return [...prev, inscripcion];
      }
    });
  };

  // ✅ Seleccionar todos los usuarios asignados
  const handleSelectAllAssigned = () => {
    const todos = usuariosAsignados;
    const yaSeleccionados = selectedAssigned.map(a => a.id);
    const nuevos = todos.filter(a => !yaSeleccionados.includes(a.id));
    
    if (nuevos.length === 0) {
      setSelectedAssigned([]);
    } else {
      setSelectedAssigned(prev => [...prev, ...nuevos]);
    }
  };

  // ✅ Verificar si todos los asignados están seleccionados
  const todosAsignadosSeleccionados = () => {
    if (usuariosAsignados.length === 0) return false;
    const idsAsignados = usuariosAsignados.map(a => a.id);
    const idsSeleccionados = selectedAssigned.map(a => a.id);
    return idsAsignados.every(id => idsSeleccionados.includes(id));
  };

  // ✅ Eliminar múltiples usuarios asignados
  const handleEliminarMultiples = async () => {
    if (selectedAssigned.length === 0) {
      Swal.fire('Error', 'Selecciona al menos un usuario para eliminar', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar asignaciones?',
      text: `Estás a punto de eliminar ${selectedAssigned.length} asignaciones. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const promesas = selectedAssigned.map(inscripcion => 
        fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      const respuestas = await Promise.all(promesas);
      const errores = respuestas.filter(r => !r.ok);

      if (errores.length > 0) {
        throw new Error(`Error al eliminar ${errores.length} asignaciones`);
      }

      Swal.fire('Éxito', `${selectedAssigned.length} asignaciones eliminadas`, 'success');
      setSelectedAssigned([]);
      cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  // ✅ Eliminar TODOS los usuarios asignados
  const handleEliminarTodos = async () => {
    if (usuariosAsignados.length === 0) {
      Swal.fire('Info', 'No hay usuarios asignados para eliminar', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar TODAS las asignaciones?',
      text: `Estás a punto de eliminar ${usuariosAsignados.length} asignaciones. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar todas',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const promesas = usuariosAsignados.map(inscripcion => 
        fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      const respuestas = await Promise.all(promesas);
      const errores = respuestas.filter(r => !r.ok);

      if (errores.length > 0) {
        throw new Error(`Error al eliminar ${errores.length} asignaciones`);
      }

      Swal.fire('Éxito', `Todas las asignaciones (${usuariosAsignados.length}) fueron eliminadas`, 'success');
      setSelectedAssigned([]);
      cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Asignar todos los usuarios seleccionados
  const handleAsignarMultiples = async () => {
    if (selectedUsers.length === 0) {
      Swal.fire('Error', 'Selecciona al menos un usuario', 'error');
      return;
    }

    // Verificar que no estén ya asignados
    const yaAsignados = selectedUsers.filter(u => 
      usuariosAsignados.some(a => a.usuario_id === u.id)
    );

    if (yaAsignados.length > 0) {
      Swal.fire('Error', `Algunos usuarios ya están asignados: ${yaAsignados.map(u => u.nombre).join(', ')}`, 'error');
      return;
    }

    try {
      const promesas = selectedUsers.map(user => 
        fetch(`${API_URL}/api/inscripciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            usuario_id: user.id,
            curso_id: cursoId,
            estado: estado
          })
        })
      );

      const respuestas = await Promise.all(promesas);
      const errores = respuestas.filter(r => !r.ok);

      if (errores.length > 0) {
        throw new Error(`Error al asignar ${errores.length} usuarios`);
      }

      Swal.fire('Éxito', `${selectedUsers.length} usuarios asignados al curso`, 'success');
      setSelectedUsers([]);
      cargarDatos();
      
      if (onAssign) onAssign();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  // ✅ Eliminar un solo usuario asignado
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
        setSelectedAssigned([]);
        cargarDatos();

      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
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
      <div className="card" style={{ maxWidth: '1500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">ASIGNAR USUARIOS AL CURSO</h5>
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
                <h6 className="mb-3">ASIGNAR NUEVO USUARIO</h6>
                
                {/* Búsqueda */}
                <div className="input-group mb-3">
                  <span className="input-group-text">🔍</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar usuario por nombre o proceso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleSelectByProcess}
                    title="Seleccionar todos los usuarios del proceso buscado"
                  >
                    <Users size={18} />
                  </button>
                </div>

                {/* Botones de selección masiva */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    className="btn btn-outline-secondary btn-sm flex-grow-1"
                    onClick={handleSelectAll}
                  >
                    {todosSeleccionados() ? (
                      <>
                        <Square size={16} className="me-1" />
                        Deseleccionar Todos
                      </>
                    ) : (
                      <>
                        <CheckSquare size={16} className="me-1" />
                        Seleccionar Todos ({usuariosDisponibles.length})
                      </>
                    )}
                  </button>
                </div>

                {/* Lista de usuarios disponibles */}
                <div className="list-group mb-3">
                  {usuariosDisponibles.length === 0 ? (
                    <div className="alert alert-info mb-0">
                      No hay usuarios disponibles o todos están asignados
                    </div>
                  ) : (
                    usuariosDisponibles.map(usuario => {
                      const isSelected = selectedUsers.some(u => u.id === usuario.id);
                      return (
                        <button
                          key={usuario.id}
                          className={`list-group-item list-group-item-action text-start ${
                            isSelected ? 'active' : ''
                          }`}
                          onClick={() => handleSelectUser(usuario)}
                        >
                          <div className="d-flex align-items-center">
                            <span className="me-2">
                              {isSelected ? '✅' : '☐'}
                            </span>
                            <div>
                              <div>
                                <strong>{usuario.nombre} - </strong>
                                <span className="badge bg-info2 ms-2">
                                  {usuario.proceso || 'Sin proceso'}
                                </span>
                              </div>
                              <p className="mb-0 small text-muted" style={{ fontSize: '12px' }}>
                                Cédula de Identidad: {usuario.cedula_identidad || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Usuarios seleccionados para asignar */}
                {selectedUsers.length > 0 && (
                  <div className="alert alert-primary">
                    <strong>{selectedUsers.length}</strong> usuario(s) seleccionado(s) para asignar
                  </div>
                )}

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
                  className="btn-asignarU"
                  onClick={handleAsignarMultiples}
                  disabled={selectedUsers.length === 0}
                >
                  <Plus size={18} className="me-2" />
                  Asignar {selectedUsers.length > 0 ? `${selectedUsers.length} usuario(s)` : 'Usuario'}
                </button>
              </div>

              {/* Panel de usuarios asignados */}
              <div className="col-lg-6">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">🧑‍💼 Usuarios Asignados ({usuariosAsignados.length})</h6>
                  
                  {/* Botones para eliminar */}
                  {usuariosAsignados.length > 0 && (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleSelectAllAssigned}
                        title="Seleccionar todos"
                      >
                        {todosAsignadosSeleccionados() ? '✅' : '☐'}
                      </button>
                      
                      {selectedAssigned.length > 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={handleEliminarMultiples}
                          title={`Eliminar ${selectedAssigned.length} seleccionados`}
                        >
                          <Trash2 size={14} className="me-1" />
                          {selectedAssigned.length}
                        </button>
                      )}
                      
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleEliminarTodos}
                        title="Eliminar todos"
                      >
                        <XCircle size={14} className="me-1" />
                        Todos
                      </button>
                    </div>
                  )}
                </div>

                <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto', fontSize: '14px' }}>
                  {usuariosAsignados.length === 0 ? (
                    <div className="alert alert-info mb-0">
                      No hay usuarios asignados aún
                    </div>
                  ) : (
                    usuariosAsignados.map(inscripcion => {
                      const isSelected = selectedAssigned.some(a => a.id === inscripcion.id);
                      return (
                        <div 
                          key={inscripcion.id} 
                          className={`list-group-item d-flex justify-content-between align-items-start ${
                            isSelected ? 'list-group-item-danger' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectAssigned(inscripcion)}
                        >
                          <div className="d-flex align-items-start">
                            <span className="me-2 mt-1">
                              {isSelected ? '✅' : '☐'}
                            </span>
                            <div>
                              <strong>{inscripcion.usuario_nombre}</strong>
                              {inscripcion.proceso && (
                                <span className="badge bg-info2 ms-2">
                                  {inscripcion.proceso}
                                </span>
                              )}
                              <p className="mb-0 small text-muted" style={{ fontSize: '12px' }}>
                                Cédula: {inscripcion.cedula_identidad || 'N/A'}
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
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminar(inscripcion.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
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
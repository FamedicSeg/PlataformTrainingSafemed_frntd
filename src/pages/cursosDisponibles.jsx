import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

/**
 * CursosDisponibles - Página de cursos asignados al estudiante
 * Muestra todos los cursos que el admin ha asignado al usuario
 */
export default function CursosDisponibles() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("user_token");
  const usuario = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');

  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar cursos e inscripciones del usuario
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar todos los cursos disponibles
      const cursosRes = await fetch(`${API_URL}/api/cursos/disponibles`);
      const cursosData = await cursosRes.json();
      setCursos(cursosData.data?.filter(c => c.activo) || []);

      // Cargar inscripciones del usuario
      if (usuario.id) {
        const inscripcionesRes = await fetch(`${API_URL}/api/inscripciones/usuario/${usuario.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const inscripcionesData = await inscripcionesRes.json();
        setInscripciones(inscripcionesData.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar los cursos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerCurso = (cursoId) => {
    console.log('📖 Navegando al curso:', cursoId);
    navigate(`/curso/${cursoId}`);
  };

  // Obtener solo los cursos asignados (inscritos)
  const cursosAsignados = cursos.filter(curso =>
    inscripciones.some(i => i.curso_id === curso.id)
  );

  // Filtrar por búsqueda
  const cursosFiltrados = cursosAsignados.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 mb-1">📚 Mis Cursos</h1>
        <p className="text-muted mb-0">
          {cursosAsignados.length > 0
            ? `Tienes ${cursosAsignados.length} curso(s) asignado(s). ¡Comienza a aprender!`
            : 'No tienes cursos asignados aún.'
          }
        </p>
      </div>

      {/* Búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Estado */}
      {cursosAsignados.length > 0 && (
        <div className="row mb-4">
          <div className="col-auto">
            <div className="alert alert-info mb-0">
              <strong>{cursosFiltrados.length}</strong> curso(s) encontrado(s)
            </div>
          </div>
        </div>
      )}

      {/* Cursos Asignados */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : cursosAsignados.length === 0 ? (
        <div className="alert alert-warning text-center" role="alert">
          <h5>📭 No tienes cursos asignados</h5>
          <p className="mb-0">Ponte en contacto con tu administrador para que te asigne cursos.</p>
        </div>
      ) : cursosFiltrados.length === 0 ? (
        <div className="alert alert-warning text-center" role="alert">
          No se encontraron cursos con esa búsqueda.
        </div>
      ) : (
        <div className="row g-4">
          {cursosFiltrados.map(curso => {
            const inscripcion = inscripciones.find(i => i.curso_id === curso.id);
            
            return (
              <div key={curso.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-success" style={{
                  transition: 'all 0.3s ease',
                  borderWidth: '2px'
                }}>
                  {/* Header */}
                  <div className="card-header bg-light-success d-flex justify-content-between align-items-start" style={{ backgroundColor: '#d4edda' }}>
                    <div>
                      <h6 className="card-title mb-1">{curso.nombre}</h6>
                      <small className="text-muted">{curso.proceso_name}</small>
                    </div>
                    <span className="badge bg-success">✓ Asignado</span>
                  </div>

                  {/* Body */}
                  <div className="card-body d-flex flex-column">
                    <p className="card-text text-muted small mb-3">
                      {curso.descripcion}
                    </p>

                    {/* Estado de inscripción */}
                    {inscripcion && (
                      <div className="mb-3 mt-auto">
                        <small className="text-muted d-block mb-2">
                          <strong>Estado:</strong>
                        </small>
                        <span className={`badge bg-${
                          inscripcion.estado === 'no iniciado' ? 'secondary' :
                          inscripcion.estado === 'en progreso' ? 'warning' :
                          'success'
                        }`}>
                          {inscripcion.estado === 'no iniciado' && '⚪ No iniciado'}
                          {inscripcion.estado === 'en progreso' && '🔵 En progreso'}
                          {inscripcion.estado === 'completado' && '✅ Completado'}
                        </span>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="d-grid gap-2 mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleVerCurso(curso.id)}
                        disabled={loading}
                      >
                        <BookOpen size={16} className="me-2" />
                        Ver Contenido
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

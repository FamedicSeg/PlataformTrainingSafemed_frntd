import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

/**
 * VisorCurso - Página para ver el contenido de un curso
 * Muestra los módulos y permite completar el curso
 */
export default function VisorCurso() {
  const navigate = useNavigate();
  const { cursoId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("user_token");
  const usuario = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');

  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [inscripcion, setInscripcion] = useState(null);
  const [moduloActual, setModuloActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);

  // Cargar datos del curso
  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  const cargarCurso = async () => {
    try {
      setLoading(true);

      // Obtener módulos del curso
      const modulosRes = await fetch(`${API_URL}/api/modulos/curso/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const modulosData = await modulosRes.json();
      
      if (modulosData.success) {
        setModulos(modulosData.data || []);
      }

      // Obtener inscripción actual
      const inscripcionesRes = await fetch(`${API_URL}/api/inscripciones/usuario/${usuario.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const inscripcionesData = await inscripcionesRes.json();
      const inscripcionCurso = inscripcionesData.data?.find(i => i.curso_id === parseInt(cursoId));
      setInscripcion(inscripcionCurso);

      if (inscripcionCurso) {
        setCurso({
          id: parseInt(cursoId),
          nombre: inscripcionCurso.curso_nombre,
          descripcion: inscripcionCurso.descripcion
        });

        // Si el estado es 'no iniciado', cambiar a 'en progreso'
        if (inscripcionCurso.estado === 'no iniciado') {
          console.log('📖 Marcando curso como "en progreso"...');
          try {
            const updateRes = await fetch(`${API_URL}/api/inscripciones/${inscripcionCurso.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ estado: 'en progreso' })
            });

            if (updateRes.ok) {
              console.log('✅ Estado actualizado a "en progreso"');
              // Actualizar estado local
              setInscripcion(prev => ({ ...prev, estado: 'en progreso' }));
            }
          } catch (error) {
            console.error('⚠️ Error al actualizar estado:', error);
            // No mostrar error - es solo una actualización automática
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos del curso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSiguiente = () => {
    if (moduloActual < modulos.length - 1) {
      setModuloActual(moduloActual + 1);
    }
  };

  const handleAnterior = () => {
    if (moduloActual > 0) {
      setModuloActual(moduloActual - 1);
    }
  };

  const handleCompletarCurso = async () => {
    const result = await Swal.fire({
      title: '¿Completar curso?',
      text: 'Marcarás este curso como completado',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setCompletando(true);

      const response = await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'completado' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al completar el curso');
      }

      Swal.fire(
        '¡Excelente!',
        'Has completado el curso exitosamente',
        'success'
      );

      setTimeout(() => navigate('/cursos-disponibles'), 2000);

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message || 'Error al completar el curso', 'error');
    } finally {
      setCompletando(false);
    }
  };

  const moduloActualData = modulos[moduloActual];
  const progreso = Math.round((moduloActual + 1) / modulos.length * 100);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">No se encontró el curso</div>
        <button className="btn btn-primary" onClick={() => navigate('/cursos-disponibles')}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <button
          className="btn btn-sm btn-outline-primary mb-3"
          onClick={() => navigate('/cursos-disponibles')}
        >
          <ArrowLeft size={16} className="me-2" />
          Volver
        </button>
        <h1 className="h3">{curso.nombre}</h1>
        <p className="text-muted">{curso.descripcion}</p>
      </div>

      {/* Progreso */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">Progreso: {progreso}%</span>
            <small className="text-muted">{moduloActual + 1} de {modulos.length} módulos</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${progreso}%` }}
              aria-valuenow={progreso}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Visor de contenido */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <BookOpen size={20} className="me-2" style={{ marginBottom: '-3px' }} />
                {moduloActualData?.titulo || 'Módulo'}
              </h5>
            </div>
            <div className="card-body">
              {moduloActualData ? (
                <>
                  {/* Contenido según el tipo */}
                  {moduloActualData.tipo === 'video' && (
                    <div className="mb-4">
                      <iframe
                        width="100%"
                        height="400"
                        src={moduloActualData.url}
                        title={moduloActualData.titulo}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {moduloActualData.tipo === 'imagen' && (
                    <div className="mb-4 text-center">
                      <img
                        src={moduloActualData.url}
                        alt={moduloActualData.titulo}
                        className="img-fluid"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                  )}

                  {moduloActualData.tipo === 'pdf' && (
                    <div className="mb-4">
                      <a
                        href={moduloActualData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        📄 Descargar PDF
                      </a>
                    </div>
                  )}

                  {moduloActualData.tipo === 'texto' && (
                    <div className="mb-4 bg-light p-4 rounded">
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {moduloActualData.contenido}
                      </pre>
                    </div>
                  )}

                  {/* Descripción */}
                  {moduloActualData.contenido && moduloActualData.tipo !== 'texto' && (
                    <div className="alert alert-info">
                      {moduloActualData.contenido}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted">No hay contenido disponible</p>
              )}
            </div>

            {/* Navegación */}
            <div className="card-footer d-flex justify-content-between">
              <button
                className="btn btn-outline-secondary"
                onClick={handleAnterior}
                disabled={moduloActual === 0}
              >
                ← Anterior
              </button>

              {moduloActual === modulos.length - 1 ? (
                <button
                  className="btn btn-success"
                  onClick={handleCompletarCurso}
                  disabled={completando}
                >
                  {completando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Completando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="me-2" />
                      Completar Curso
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSiguiente}
                  disabled={moduloActual === modulos.length - 1}
                >
                  Siguiente →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Índice de módulos */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-light">
              <h6 className="mb-0">Módulos del Curso</h6>
            </div>
            <div className="list-group list-group-flush">
              {modulos.map((modulo, index) => (
                <button
                  key={modulo.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    index === moduloActual ? 'active' : ''
                  }`}
                  onClick={() => setModuloActual(index)}
                >
                  <span>{modulo.titulo}</span>
                  {index < moduloActual && (
                    <CheckCircle size={18} className="text-success" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de inscripción */}
          <div className="card mt-4">
            <div className="card-body">
              <h6 className="card-title mb-3">
                <Clock size={18} className="me-2" style={{ marginBottom: '-3px' }} />
                Estado
              </h6>
              <div>
                <strong>Inscripción:</strong>
                <br />
                <span className={`badge bg-${
                  inscripcion?.estado === 'completado' ? 'success' :
                  inscripcion?.estado === 'en progreso' ? 'warning' :
                  'secondary'
                }`}>
                  {inscripcion?.estado || 'No inscrito'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

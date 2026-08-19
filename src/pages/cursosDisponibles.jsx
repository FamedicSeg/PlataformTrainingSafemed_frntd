import { useState, useEffect, useRef } from 'react';
import { BookOpen, Award, Clock } from 'lucide-react';
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

  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef(null);

  // Actualizar "now" cada 30 segundos para habilitar botones a su hora exacta
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Cargar capacitaciones del usuario (cursos + estado + nota)
  useEffect(() => {
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inscripciones/mis-capacitaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCapacitaciones(data.data || []);
      } else {
        throw new Error(data.message || 'Error al cargar capacitaciones');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar las capacitaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerCurso = (cursoId) => {
    navigate(`/curso/${cursoId}`);
  };

  // Detectar si una capacitación ha expirado
  const esCursoExpirado = (cap) => {
    if (!cap.fecha_fin) return false;
    return new Date() > new Date(cap.fecha_fin);
  };

  // Detectar si el curso aún no ha llegado a su fecha de inicio programada
  const esCursoProximo = (cap) => {
    if (!cap.fecha_inicio) return false;
    return now < new Date(cap.fecha_inicio);
  };

  // Formatear fecha/hora de inicio para mostrar al usuario
  const formatFechaInicio = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Filtrar por búsqueda
  const capacitacionesFiltradas = capacitaciones.filter(c =>
    (c.curso_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion   || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 mb-1">📚 Mis Capacitaciones</h1>
        <p className="text-muted mb-0">
          {capacitaciones.length > 0
            ? `Tienes ${capacitaciones.length} capacitación(es) asignada(s). ¡Comienza a aprender!`
            : 'No tienes capacitaciones asignadas aún.'
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
      {capacitaciones.length > 0 && (
        <div className="row mb-4">
          <div className="col-auto">
            <div className="alert alert-info mb-0">
              <strong>{capacitacionesFiltradas.length}</strong> capacitación(es) encontrada(s)
            </div>
          </div>
        </div>
      )}

      {/* Capacitaciones */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : capacitaciones.length === 0 ? (
        <div className="alert alert-warning text-center" role="alert">
          <h5>📭 No tienes capacitaciones asignadas</h5>
          <p className="mb-0">Ponte en contacto con tu administrador para que te asignen capacitaciones.</p>
        </div>
      ) : capacitacionesFiltradas.length === 0 ? (
        <div className="alert alert-warning text-center" role="alert">
          No se encontraron capacitaciones con esa búsqueda.
        </div>
      ) : (
        <div className="row g-4">
          {capacitacionesFiltradas.map(cap => {
            const expirado = esCursoExpirado(cap);
            const proximo = !expirado && esCursoProximo(cap);
            const tieneNota = cap.mejor_puntaje !== null && cap.mejor_puntaje !== undefined;

            return (
              <div key={cap.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm" style={{
                  transition: 'all 0.3s ease',
                  borderWidth: '2px',
                  borderColor: expirado ? '#dc3545' : proximo ? '#fd7e14' : cap.estado === 'completado' ? '#198754' : '#0d6efd',
                  borderStyle: 'solid',
                  opacity: expirado ? 0.75 : 1
                }}>
                  {/* Header */}
                  <div className="card-header d-flex justify-content-between align-items-start" style={{
                    backgroundColor: expirado ? '#f8d7da' : proximo ? '#fff3cd' : cap.estado === 'completado' ? '#d4edda' : '#e8f0fe'
                  }}>
                    <div>
                      <h6 className="card-title mb-1">{cap.curso_nombre}</h6>
                      <small className="text-muted">{cap.proceso}</small>
                    </div>
                    {expirado
                      ? <span className="badge bg-danger">⛔ Expirado</span>
                      : proximo
                        ? <span className="badge bg-warning text-dark">🕐 Próximamente</span>
                        : cap.estado === 'completado'
                          ? <span className="badge bg-success">✅ Completado</span>
                          : cap.estado === 'en progreso'
                            ? <span className="badge bg-warning text-dark">🔵 En progreso</span>
                            : <span className="badge bg-secondary">⚪ Sin iniciar</span>
                    }
                  </div>

                  {/* Body */}
                  <div className="card-body d-flex flex-column">
                    <p className="card-text text-muted small mb-3">
                      {cap.descripcion}
                    </p>

                    {/* Aviso de disponibilidad futura */}
                    {proximo && (
                      <div className="mb-3 p-2 rounded d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                        <Clock size={16} color="#856404" />
                        <small className="fw-semibold" style={{ color: '#856404' }}>
                          Disponible el {formatFechaInicio(cap.fecha_inicio)}
                        </small>
                      </div>
                    )}

                    {/* Nota de evaluación */}
                    {tieneNota ? (
                      <div className="mb-3 p-2 rounded" style={{
                        backgroundColor: cap.evaluacion_aprobada ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${cap.evaluacion_aprobada ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        <div className="d-flex align-items-center gap-2">
                          <Award size={16} color={cap.evaluacion_aprobada ? '#155724' : '#721c24'} />
                          <small className="fw-bold" style={{ color: cap.evaluacion_aprobada ? '#155724' : '#721c24' }}>
                            Nota: {Number(cap.mejor_puntaje).toFixed(1)}%
                          </small>
                          <span className={`badge ms-auto ${cap.evaluacion_aprobada ? 'bg-success' : 'bg-danger'}`}
                            style={{ fontSize: '0.7rem' }}>
                            {cap.evaluacion_aprobada ? 'Aprobado' : 'Reprobado'}
                          </span>
                        </div>
                      </div>
                    ) : cap.estado !== 'no iniciado' ? (
                      <div className="mb-3">
                        <small className="text-muted fst-italic">Sin evaluación registrada</small>
                      </div>
                    ) : null}

                    {/* Botones de acción */}
                    <div className="d-grid gap-2 mt-auto">
                      {expirado ? (
                        <button className="btn btn-danger" disabled>
                          ⛔ Capacitación Expirada
                        </button>
                      ) : proximo ? (
                        <button className="btn btn-warning text-dark" disabled>
                          <Clock size={16} className="me-2" />
                          Próximamente
                        </button>
                      ) : (
                        <button
                          className={`btn btn-${cap.estado === 'completado' ? 'success' : 'primary'}`}
                          onClick={() => handleVerCurso(cap.curso_id)}
                          disabled={loading}
                        >
                          <BookOpen size={16} className="me-2" />
                          {cap.estado === 'completado' ? 'Ver Contenido' : 'Iniciar'}
                        </button>
                      )}
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

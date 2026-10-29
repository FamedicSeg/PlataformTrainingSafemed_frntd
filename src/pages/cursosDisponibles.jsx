import { useState, useEffect, useRef } from 'react';
import { BookOpen, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { esCursoExpiradoSeguro, esCursoProximoSeguro, formatearFecha } from '../utils/dateUtils';

/**
 * CursosDisponibles - Página de cursos asignados al estudiante
 * Muestra todos los cursos que el admin ha asignado al usuario
 */
export default function CursosDisponibles() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("user_token");

  const [capacitaciones, setCapacitaciones] = useState([]);
  const [modulosPorCurso, setModulosPorCurso] = useState({}); // Cache de módulos por curso
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef(null);

  // Actualizar "now" cada segundo (para timer en vivo de sincrónicos)
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Cargar capacitaciones del usuario (cursos + estado + nota)
  useEffect(() => {
    cargarDatos();

    // Refresca cuando el usuario vuelve a esta página (después de ver un curso)
    const handleFocus = () => {
      console.log('👁️ Usuario volvió a la página, refrescando cursos...');
      cargarDatos();
    };
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
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
        console.log('✅ Cursos cargados del API:', data.data.length);
        setCapacitaciones(data.data || []);

        // Cargar módulos de cada curso para detectar VIDEO_CONFERENCIA
        const modulosCache = {};
        for (const cap of data.data) {
          try {
            const modulosRes = await fetch(`${API_URL}/api/modulos/curso/${cap.curso_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const modulosData = await modulosRes.json();
            if (modulosData.success) {
              modulosCache[cap.curso_id] = modulosData.data || [];
            }
          } catch (err) {
            modulosCache[cap.curso_id] = [];
            console.error(`Error al cargar módulos del curso ${cap.curso_id}:`, err);
          }
        }
        setModulosPorCurso(modulosCache);
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

  // Detectar sincrónico: verificar si tiene módulos de VIDEO_CONFERENCIA
  const esCursoSincronico = (cap) => {
    const modulos = modulosPorCurso[cap.curso_id] || [];
    return modulos.some(m => m.tipo === 'video_conferencia');
  };

  // Calcula tiempo restante hasta fecha_inicio
  const calcularTiempoRestante = (fechaInicio) => {
    if (!fechaInicio) return null;
    const msRestante = new Date(fechaInicio) - now;
    if (msRestante <= 0) return { signo: 0 }; // Ya es hora

    const horas = Math.floor(msRestante / (1000 * 60 * 60));
    const minutos = Math.floor((msRestante % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((msRestante % (1000 * 60)) / 1000);
    return { horas, minutos, segundos, signo: 1 };
  };

  // Formato amigable: "2h 30m 15s"
  const formatearTiempoRestante = (tiempoObj) => {
    if (!tiempoObj || tiempoObj.signo === 0) return "¡Ya es hora!";
    const { horas, minutos, segundos } = tiempoObj;
    return `${horas}h ${minutos}m ${segundos}s`;
  };

  // Determina si YA ES HORA de unirse
  const esHoraDeUnirse = (cap) => {
    if (!cap.fecha_inicio_curso) return false;
    const inicio = new Date(cap.fecha_inicio_curso);
    if (now < inicio) return false;
    // Si hay fecha_fin, validar que no haya pasado; si no, permitir
    if (cap.fecha_fin_curso) return now <= new Date(cap.fecha_fin_curso);
    return true;
  };

  // Detectar si una capacitación ha expirado
  const esCursoExpirado = (cap) => {
    return esCursoExpiradoSeguro(cap.fecha_fin_curso);
  };

  // Detectar si el curso aún no ha llegado a su fecha de inicio programada
  const esCursoProximo = (cap) => {
    return esCursoProximoSeguro(cap.fecha_inicio_curso);
  };

  // Formatear fecha/hora de inicio para mostrar al usuario
  const formatFechaInicio = (fechaStr) => {
    return formatearFecha(fechaStr, true);
  };

  // Detectar si tiene evaluación pendiente: estado completado pero sin evaluación aprobada
  const tieneEvaluacionPendiente = (cap) => {
    return cap.estado === 'completado' && (cap.mejor_puntaje === null || !cap.evaluacion_aprobada);
  };

  // Filtrar por búsqueda
  const capacitacionesFiltradas = capacitaciones.filter(c =>
    (c.curso_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-4" style={{ minHeight: '100vh', marginTop: '80px' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 mb-1">📚 Mis Capacitaciones</h1>
        <p className="text-muted mb-0">
          {capacitaciones.length > 0
            ? `Tienes ${capacitaciones.length} capacitación(es) asignada(s). ¡Comienza a aprender!`
            : 'No tienes capacitaciones asignadas aún.'}
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
            const evaluacionPendiente = tieneEvaluacionPendiente(cap);
            const tieneNota = cap.mejor_puntaje !== null && cap.mejor_puntaje !== undefined;
            const estCompletado = cap.estado === 'completado' && !evaluacionPendiente;

            return (
              <div key={cap.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm" style={{
                  transition: 'all 0.3s ease',
                  borderWidth: '2px',
                  borderColor: expirado ? '#dc3545' : proximo ? '#fd7e14' : evaluacionPendiente ? '#ffc107' : estCompletado ? '#198754' : '#0d6efd',
                  borderStyle: 'solid',
                  opacity: expirado ? 0.75 : 1
                }}>
                  {/* Header */}
                  <div className="card-header d-flex justify-content-between align-items-start" style={{
                    backgroundColor: expirado ? '#f8d7da' : proximo ? '#fff3cd' : evaluacionPendiente ? '#fff3cd' : estCompletado ? '#d4edda' : '#e8f0fe'
                  }}>
                    <div>
                      <h6 className="card-title mb-1">{cap.curso_nombre}</h6>
                      <small className="text-muted">{cap.proceso}</small>
                    </div>
                    {expirado
                      ? <span className="badge bg-danger">⛔ Expirado</span>
                      : proximo
                        ? <span className="badge bg-warning text-dark">🕐 Próximamente</span>
                        : evaluacionPendiente
                          ? <span className="badge bg-warning text-dark">⏳ Evaluación pendiente</span>
                          : estCompletado
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
                          Disponible el {formatFechaInicio(cap.fecha_inicio_curso)}
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
                      ) : evaluacionPendiente ? (
                        <button
                          className="btn btn-warning text-dark"
                          onClick={() => handleVerCurso(cap.curso_id)}
                          disabled={loading}
                        >
                          <BookOpen size={16} className="me-2" />
                          Completar Evaluación
                        </button>
                      ) : (
                        <button
                          className={`btn btn-${estCompletado ? 'success' : 'primary'}`}
                          onClick={() => handleVerCurso(cap.curso_id)}
                          disabled={loading}
                        >
                          <BookOpen size={16} className="me-2" />
                          {estCompletado ? 'Ver Contenido' : 'Iniciar curso'}
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

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
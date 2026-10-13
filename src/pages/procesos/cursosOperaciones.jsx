import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Video, Clock } from "lucide-react";
import SalaJitsiMeet from "../../components/SalaJitsiMeet";
import { esCursoExpiradoSeguro, esCursoProximoSeguro } from "../../utils/dateUtils";
import "../../styles/pages/cursos.css";

export default function CoursesOperaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const nombre = localStorage.getItem("usuario");
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("user_token");

  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState(0);
  const [_cursosCompletados, _setCursosCompletados] = useState({});
  const [_cursosAsignados, _setCursosAsignados] = useState(new Set());
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef(null);
  const [jitsiActivo, setJitsiActivo] = useState(false);
  const [cursoJitsiActual, setCursoJitsiActual] = useState(null);


  // Actualizar "now" cada segundo (para timer en vivo)
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // CARGAR CURSOS DEL USUARIO (inscripciones con proceso filtrado)
  const cargarCursosDelAPI = async () => {
    try {
      setCargandoCursos(true);
      const response = await fetch(`${API_URL}/api/inscripciones/mis-capacitaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filtrar solo cursos del proceso "Operaciones"
        const cursosDinamicos = data.data
          .filter(c => (c.proceso_nombre || '').toLowerCase() === 'operaciones - producción')
          .map((c) => ({
            id: c.curso_id,
            inscripcion_id: c.id,
            name: c.curso_nombre,
            desc: c.descripcion,
            tipo: c.tipo, // 'Sincrónico' o 'Asincrónico'
            proceso: c.proceso_nombre,
            fecha_inicio_curso: c.fecha_inicio_curso || null,
            fecha_fin_curso: c.fecha_fin_curso || null,
            estado: c.estado,
            mejor_puntaje: c.mejor_puntaje,
            evaluacion_aprobada: c.evaluacion_aprobada,
            link: c.tipo === 'Sincrónico' ? `/curso/${c.curso_id}` : `/curso/${c.curso_id}`,
            dbName: `curso_${c.curso_id}`,
            bloqueado: false,
            esEstatico: false
          }));
        
        const completadosObj = {};
        cursosDinamicos.forEach(c => {
          if (c.mejor_puntaje !== null && c.mejor_puntaje !== undefined) {
            completadosObj[c.dbName] = true;
          }
        });
        _setCursosCompletados(completadosObj);
        setCourses(cursosDinamicos);
        console.log('✓ Cursos de Operaciones cargados:', cursosDinamicos.length);
      }
    } catch (error) {
      console.error('✖ Error cargando cursos:', error);
      setCourses([]);
    } finally {
      setCargandoCursos(false);
    }
  };

  // FUNCIÃ“N PARA CARGAR PROGRESO DESDE BACKEND
  const cargarProgreso = async () => {
    try {
      const res = await fetch(`${API_URL}/api/progreso/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre })
      });

      const data = await res.json();
      const valor = data.progreso || 0;

      setProgress(valor);
      localStorage.setItem("progreso", valor);

    } catch (err) {
      console.error("⚠ Error cargando progreso:", err);
    }
  };

  // DETECTAR SI ES CURSO SINCRÃ“NICO
  const esCursoSincronico = (curso) => {
    return curso?.tipo === 'Sincrónico';
  };


  // DETECTAR SI CURSO HA EXPIRADO
  const esCursoExpirado = (curso) => {
    return esCursoExpiradoSeguro(curso.fecha_fin_curso);
  };

  // DETECTAR SI CURSO AÃšN NO HA LLEGADO
  const esCursoProximo = (curso) => {
    return esCursoProximoSeguro(curso.fecha_inicio_curso);
  };

  // CERRAR JITSI
  const handleCerrarJitsi = () => {
    setJitsiActivo(false);
    setCursoJitsiActual(null);
  };

  // VERIFICAR SI CURSO ESTÃ COMPLETADO
  const estaCursoCompletado = (cursoDbName) => {
    return _cursosCompletados[cursoDbName] || false;
  };

  // CARGAR DATOS AL INICIAR
  useEffect(() => {
    if (token) {
      cargarCursosDelAPI();
      cargarProgreso();
      
      // Verificar progreso cada 5 segundos
      const interval = setInterval(() => {
        cargarProgreso();
      }, 5000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // REFRESCAR CUANDO SE REGRESA DESDE UN CURSO
  useEffect(() => {
    if (location.state && location.state.refrescar) {
      cargarProgreso();
      cargarCursosDelAPI();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]);

  // MANEJAR CLIC EN CURSO
  const manejarClicCurso = (curso) => {
    if (esCursoExpirado(curso)) return;
    if (estaCursoCompletado(curso.dbName)) {
      if (window.confirm(`Ya completaste "${curso.name}". ¿Deseas repasarlo?`)) {
        navigate(curso.link);
      }
    } else {
      navigate(curso.link);
    }
  };

  // Calcular progreso manualmente basado en cursos completados
  const _calcularProgresoManual = () => {
    const totalCursos = courses.length;
    const cursosCompletadosCount = courses.filter(c => estaCursoCompletado(c.dbName)).length;
    return Math.round((cursosCompletadosCount / totalCursos) * 100);
  };

  return (
    <>
      {/* SI ESTÃ ACTIVO JITSI, MOSTRAR SOLO JITSI */}
      {jitsiActivo && cursoJitsiActual ? (
        <div style={{ width: '100%', height: '100vh' }}>
          <SalaJitsiMeet
            cursoId={cursoJitsiActual.id}
            nombreCurso={cursoJitsiActual.name}
            fechaInicio={cursoJitsiActual.fecha_inicio}
            userName={(() => {
              try {
                const usuario = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
                return usuario.nombre || usuario.email || 'Participante';
              } catch {
                return 'Participante';
              }
            })()}
            userEmail={(() => {
              try {
                const usuario = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
                return usuario.email || 'participante@safemedec.com';
              } catch {
                return 'participante@safemedec.com';
              }
            })()}
            onCerrar={handleCerrarJitsi}
          />
        </div>
      ) : (
        // VISTA NORMAL: LISTA DE CURSOS
        <div className="contenedor-lista-cursos">
      
          <div className="container-wide">
        
            <div className="text-center mb-5">
              <h2 className="titulo-pagina">
                Plataforma de Capacitación Laboral
              </h2>
              <h3 className="titulo-pagina">
                Cursos de Operaciones - Producción
              </h3>
              <p className="subtitulo-pagina">
                Completa los cursos paso a paso y adquiere nuevas habilidades.
              </p>
            </div>

        {/* PROGRESO GENERAL 
        <div className="progreso-contenedor mb-5">
          <label className="form-label fw-semibold">
            Progreso general:
            <span className="ms-2 text-muted">
              {courses.filter(c => estaCursoCompletado(c.dbName)).length} de {courses.length} cursos completados
            </span>
          </label>
          <div className="progress barra-progreso">
            <div
              className={`progress-bar progress-bar-striped progress-bar-animated 
                ${progress === 100 ? "bg-success" : "bg-info"}`}
              style={{ width: `${progress}%` }}
            >
              <span className="porcentaje">{progress}%</span>
            </div>
          </div>
          <div className="text-end mt-1">
            <small className="text-muted">
              Progreso calculado automÃ¡ticamente
            </small>
          </div>
        </div>
        */}

        {/* LISTA DE CURSOS */}
        <h4 className="fw-bold text-secondary mb-4">
          Cursos disponibles
          {cargandoCursos && (
            <span className="ms-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </span>
          )}
        </h4>

        <div className="columna-cursos-disponibles-tarjeta">
          {courses.map((curso) => {
            const completado = estaCursoCompletado(curso.dbName);
            const proximo = !curso.bloqueado && !!curso.fecha_inicio_curso && new Date(curso.fecha_inicio_curso) > new Date();
            const noDisponible = curso.bloqueado || proximo;
            
            return (
              <div key={curso.id} className="tarjeta-curso">
                <div className={`card card-curso shadow-sm h-100 ${completado ? 'curso-completado' : ''} ${noDisponible ? 'curso-bloqueado' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="titulo-curso">
                        {curso.name}
                      </h5>
                      {noDisponible ? (
                        <span className="badge bg-warning text-dark">
                          
                        </span>
                      ) : completado && (
                        <span className="badge bg-success">
                          ✅
                        </span>
                      )}
                    </div>
                    <p className="descripcion-curso">
                      {curso.desc}
                    </p>

                    {/* Aviso de disponibilidad futura */}
                    {proximo && (
                      <div className="mb-2 p-2 rounded" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', fontSize: '0.8rem', color: '#856404' }}>
                         Disponible el {new Date(curso.fecha_inicio_curso).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    
                    {/* Estado del curso */}
                    <div className="mt-auto">
                      <div className="mb-2">
                        <small className={`badge ${noDisponible ? 'bg-warning text-dark' : completado ? 'bg-success' : 'bg-secondary'}`}>
                          {noDisponible ? 'Próximamente' : completado ? '✅ Curso realizado' : 'Por comenzar'}
                        </small>
                        {esCursoSincronico(curso) && (
                          <span className="badge bg-info ms-2"></span>
                        )}
                      </div>
                      
                      {/* BOTONES POR TIPO DE CURSO */}
                      {esCursoExpirado(curso) ? (
                        // Curso expirado
                        <button className="btn-no-disponible-curso" disabled>
                          ⛔ No Disponible
                        </button>
                      )  : (
                        // CURSOS ASINCRONICOS
                        <>
                          {esCursoProximo(curso) ? (
                            <button className="btn btn-warning text-dark w-100" disabled>
                              <Clock size={16} className="me-2" />
                              Próximamente
                            </button>
                          ) : (
                            <button
                              className={`btn-${completado ? 'iniciar' : 'primero'} w-100`}
                              onClick={() => manejarClicCurso(curso)}
                              disabled={cargandoCursos}
                            >
                              {completado ? '✅ Curso realizado' : 'Iniciar curso'}
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Botón para repasar incluso si está completado */}
                      {!noDisponible && completado && (
                        <button
                          className="btn btn-outline-primary w-100 mt-2"
                          onClick={() => navigate(curso.link, { state: { courseId: curso.id, repasar: true } })}
                        >
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Volver a Revisar el Curso
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen de progreso 
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Resumen de progreso</h5>
            <div className="row">
              <div className="col-md-6">
                <ul className="list-group">
                  {courses.map(curso => (
                    <li key={curso.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{curso.name.split('. ')[1]}</span>
                      <span className={`badge ${estaCursoCompletado(curso.dbName) ? 'bg-success' : 'bg-secondary'}`}>
                        {estaCursoCompletado(curso.dbName) ? 'Completado' : 'Pendiente'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <div className="text-center">
                  <div className="display-4 text-primary">
                    {courses.filter(c => estaCursoCompletado(c.dbName)).length}/{courses.length}
                  </div>
                  <p className="text-muted">Cursos completados</p>
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ 
                        width: `${(courses.filter(c => estaCursoCompletado(c.dbName)).length / courses.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* PRUEBA FINAL 
        <div className="text-center mt-5">
          {progress === 100 ? (
            localStorage.getItem("pruebaAprobada") === "true" ? (
              <div className="alert alert-success py-3">
                <i className="bi bi-award me-2"></i>
                ¡Felicidades! Has completado toda la capacitación y aprobado la prueba final.
              </div>
            ) : (
              <button
                className="btn btn-final"
                onClick={() => navigate("/prueba")}
              >
                Ir a la prueba final
              </button>
            )
          ) : null}
        </div> */}

      </div>

        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(27, 177, 167, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
}


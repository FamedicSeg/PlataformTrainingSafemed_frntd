import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/pages/cursos.css";

export default function CoursesTTHH() {
  const navigate = useNavigate();
  const location = useLocation();
  const nombre = localStorage.getItem("usuario");
  const API_URL = import.meta.env.VITE_API_URL;

  const [courses, setCourses] = useState([]);
  const [cursosCompletados, setCursosCompletados] = useState({});
  const [cargandoCursos, setCargandoCursos] = useState(true);

  // Cursos estáticos originales (con su contenido existente)
  const cursosEstaticos = [
    { 
      id: "estatico_1", 
      name: "1. Reglamento Interno de Trabajo - Código de Ética - Política de Responsabilidad Social", 
      desc: "Duración: 2 horas", 
      link: "/courses/reglamentointerno",
      dbName: "reglamentoInterno",
      bloqueado: false,
      esEstatico: true
    },
    { 
      id: "estatico_2", 
      name: "2. Derechos laborales de mujeres y hombres", 
      desc: "Duración: 10 horas", 
      link: "/courses/derechoslaborales",
      dbName: "derechos_laborales",
      bloqueado: false,
      esEstatico: true
    },
    { 
      id: "estatico_3", 
      name: "3. Igualdad de género", 
      desc: "Duración: 10 horas", 
      link: "/courses/igualdadgenero",
      dbName: "igualdad_genero",
      bloqueado: false,
      esEstatico: true
    },
    { 
      id: "estatico_4", 
      name: "4. Erradicación de violencia y no discriminación en un centro de trabajo", 
      desc: "Duración: 10 horas", 
      link: "/courses/erradicacionviolencia",
      dbName: "erradicacion_Violencia",
      bloqueado: false,
      esEstatico: true
    },
    { 
      id: "estatico_5", 
      name: "5. Otros relacionados para establecer el trabajo de igual valor", 
      desc: "Duración: 10 horas", 
      link: "/courses/otrosrelacionados",
      dbName: "otrosRelacionados",
      bloqueado: false,
      esEstatico: true
    }
  ];

  // CARGAR CURSOS DESDE LA API Y COMBINAR CON ESTÁTICOS
  const cargarCursosDelAPI = async () => {
    try {
      setCargandoCursos(true);
      const response = await fetch(`${API_URL}/api/cursos/disponibles`);
      const data = await response.json();
      
      // Filtrar solo cursos de "Talento Humano" que estén activos
      const cursosDinamicos = (data.data || [])
        .filter(c => c.proceso_name === "Talento Humano" && c.activo)
        .map((c) => ({
          id: c.id,
          name: c.nombre,
          desc: c.descripcion,
          link: `/curso/${c.id}`, // Usa el visor dinámico
          dbName: `curso_${c.id}`, // Identificador único
          bloqueado: false,
          esEstatico: false,
          fecha_inicio: c.fecha_inicio || null
        }));
      
      // Combinar: primero dinámicos, luego estáticos
      const todosCursos = [...cursosDinamicos, ...cursosEstaticos];
      setCourses(todosCursos);
      console.log('✅ Cursos cargados:', cursosDinamicos.length, '+ Estáticos:', cursosEstaticos.length);
    } catch (error) {
      console.error('❌ Error cargando cursos:', error);
      // Si hay error, mostrar solo estáticos
      setCourses(cursosEstaticos);
    } finally {
      setCargandoCursos(false);
    }
  };

  // FUNCIÓN PARA CARGAR CURSOS COMPLETADOS
  const cargarCursosCompletados = async () => {
    if (!nombre) return;
    
    try {
      const token = localStorage.getItem("user_token");

      const [respDinamicos, respEstaticos] = await Promise.all([
        fetch(`${API_URL}/api/inscripciones/mis-capacitaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/progreso/cursos-completados/${encodeURIComponent(nombre)}`)
      ]);

      const completadosObj = {};

      // Cursos dinámicos: completados si tienen mejor_puntaje
      const dataDinamicos = await respDinamicos.json();
      if (dataDinamicos.success && dataDinamicos.data) {
        dataDinamicos.data.forEach(inscripcion => {
          if (inscripcion.mejor_puntaje !== null && inscripcion.mejor_puntaje !== undefined) {
            completadosObj[`curso_${inscripcion.curso_id}`] = true;
          }
        });
      }

      // Cursos estáticos: completados según cursos_completados en BD
      const dataEstaticos = await respEstaticos.json();
      if (dataEstaticos.ok && dataEstaticos.cursosCompletados) {
        dataEstaticos.cursosCompletados.forEach(curso => {
          completadosObj[curso] = true;
        });
      }

      setCursosCompletados(completadosObj);
      console.log('✅ Cursos completados:', Object.keys(completadosObj).length);
    } catch (error) {
      console.error("⚠ Error cargando cursos completados:", error);
    }
  };

  // Cargar progreso al entrar por primera vez
  useEffect(() => {
    // Cargar cursos desde API
    cargarCursosDelAPI();

    if (nombre) {
      cargarCursosCompletados();
    }
  }, [nombre]);

  // Refrescar cuando se regresa desde un curso
  useEffect(() => {
    if (location.state && location.state.refrescar) {
      cargarCursosCompletados();
      cargarCursosDelAPI();
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Verificar si un curso específico está completado
  const estaCursoCompletado = (cursoDbName) => {
    return cursosCompletados[cursoDbName] || false;
  };

  // Calcular progreso manualmente basado en cursos completados
  const _calcularProgresoManual = () => {
    const totalCursos = courses.length;
    const cursosCompletadosCount = courses.filter(c => estaCursoCompletado(c.dbName)).length;
    return Math.round((cursosCompletadosCount / totalCursos) * 100);
  };

  // Manejar clic en botón de curso
  const manejarClicCurso = (curso) => {
    if (curso.bloqueado) return;
    if (estaCursoCompletado(curso.dbName)) {
      // Si el curso ya está completado, preguntar si quiere repasar
      if (window.confirm(`Ya completaste "${curso.name}". ¿Deseas repasarlo?`)) {
        navigate(curso.link);
      }
    } else {
      // Si no está completado, iniciar normalmente
      navigate(curso.link);
    }
  };

  // Solo los 4 temas cuentan para habilitar la prueba (Reglamento no es requisito)
  const TTHH_REQUERIDOS = ['derechos_laborales', 'igualdad_genero', 'erradicacion_Violencia', 'otrosRelacionados'];
  const listo4Cursos = TTHH_REQUERIDOS.every(dbName => cursosCompletados[dbName]);
  const completadosRequeridos = TTHH_REQUERIDOS.filter(dbName => cursosCompletados[dbName]).length;

  return (
    <div className="container-fluid py-5 mt-5">
      
      <div className="container-wide">
        
        <div className="text-center mb-5">
          <h2 className="titulo-pagina">
            Plataforma de Capacitación Interna
          </h2>
          <h3 className="titulo-pagina">
            Cursos de Talento Humano
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
              Progreso calculado automáticamente
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

        <div className="row g-4 mb-5">
          {courses.map((curso) => {
            const completado = estaCursoCompletado(curso.dbName);
            const proximo = !curso.bloqueado && !!curso.fecha_inicio && new Date(curso.fecha_inicio) > new Date();
            const noDisponible = curso.bloqueado || proximo;
            
            return (
              <div key={curso.id} className="col-md-3">
                <div className={`card card-curso shadow-sm h-100 ${completado ? 'curso-completado' : ''} ${noDisponible ? 'curso-bloqueado' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="titulo-curso">
                        {curso.name}
                      </h5>
                      {noDisponible ? (
                        <span className="badge bg-warning text-dark">
                          🕐
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
                        🕐 Disponible el {new Date(curso.fecha_inicio).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    
                    {/* Estado del curso */}
                    <div className="mt-auto">
                      <div className="mb-2">
                        <small className={`badge ${noDisponible ? 'bg-warning text-dark' : completado ? 'bg-success' : 'bg-secondary'}`}>
                          {noDisponible ? 'Próximamente' : completado ? 'Completado' : 'Por comenzar'}
                        </small>
                        {!noDisponible && completado && (
                          <small className="ms-2 text-success">
                            <i className="bi bi-check-circle"></i> Realizado
                          </small>
                        )}
                      </div>
                      
                      <button
                        className={`btn w-100 ${noDisponible ? 'btn-warning' : completado ? 'btn-success' : 'btn-iniciar'}`}
                        onClick={() => manejarClicCurso(curso)}
                        disabled={noDisponible}
                      >
                        {noDisponible ? (
                          <>
                            <i className="bi bi-clock me-2"></i>
                            PRÓXIMAMENTE
                          </>
                        ) : completado ? (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Curso realizado
                          </>
                        ) : (
                          'Iniciar curso'
                        )}
                      </button>
                      
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

        {/* PRUEBA FINAL */}
        <div className="text-center mt-5">
          {listo4Cursos ? (
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
                Ir a la prueba final 📝
              </button>
            )
          ) : (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              La prueba final se habilitará cuando completes los 4 temas requeridos ({completadosRequeridos}/4 completados).
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
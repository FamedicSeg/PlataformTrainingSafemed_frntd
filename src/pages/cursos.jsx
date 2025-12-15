import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/pages/cursos.css";

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  const nombre = localStorage.getItem("usuario");
  const API_URL = import.meta.env.VITE_API_URL;

  const courses = [
    { 
      id: 1, 
      name: "1. Derechos laborales de mujeres y hombres", 
      desc: "Duración: 10 horas", 
      link: "/courses/derechoslaborales",
      dbName: "derechos_laborales" // Nombre en la base de datos
    },
    { 
      id: 2, 
      name: "2. Igualdad de género", 
      desc: "Duración: 10 horas", 
      link: "/courses/igualdadgenero",
      dbName: "igualdad_genero"
    },
    { 
      id: 3, 
      name: "3. Erradicación de violencia y no discriminación en un centro de trabajo", 
      desc: "Duración: 10 horas", 
      link: "/courses/erradicacionviolencia",
      dbName: "erradicacion_Violencia"
    },
    { 
      id: 4, 
      name: "4. Otros relacionados para establecer el trabajo de igual valor", 
      desc: "Duración: 10 horas", 
      link: "/courses/otrosrelacionados",
      dbName: "otrosRelacionados"
    },
  ];

  const [progress, setProgress] = useState(0);
  const [cursosCompletados, setCursosCompletados] = useState({});
  const [cargandoCursos, setCargandoCursos] = useState(true);

  // FUNCIÓN PARA CARGAR PROGRESO DESDE BACKEND
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

  // FUNCIÓN PARA CARGAR CURSOS COMPLETADOS
  const cargarCursosCompletados = async () => {
    if (!nombre) return;
    
    try {
      setCargandoCursos(true);
      
      // Opción 1: Cargar todos los cursos completados de una vez
      const response = await fetch(`${API_URL}/api/progreso/cursos-completados/${nombre}`);
      const data = await response.json();
      
      if (data.ok && data.cursosCompletados) {
        // Crear un objeto con los cursos completados
        const completadosObj = {};
        data.cursosCompletados.forEach(curso => {
          completadosObj[curso] = true;
        });
        setCursosCompletados(completadosObj);
      }
      
      // Opción 2: Verificar cada curso individualmente (más preciso pero más lento)
      const verificaciones = await Promise.all(
        courses.map(async (curso) => {
          try {
            const res = await fetch(`${API_URL}/api/progreso/curso-completado`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nombre, curso: curso.dbName })
            });
            const data = await res.json();
            return { [curso.dbName]: data.completado };
          } catch (error) {
            console.error(`Error verificando curso ${curso.dbName}:`, error);
            return { [curso.dbName]: false };
          }
        })
      );
      
      const todosCompletados = verificaciones.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setCursosCompletados(todosCompletados);
  
      
    } catch (error) {
      console.error("⚠ Error cargando cursos completados:", error);
    } finally {
      setCargandoCursos(false);
    }
  };

  // Cargar progreso al entrar por primera vez
  useEffect(() => {
    if (nombre) {
      cargarProgreso();
      cargarCursosCompletados();
      
      // Verificar progreso cada 5 segundos
      const interval = setInterval(() => {
        cargarProgreso();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [nombre]);

  // Refrescar cuando se regresa desde un curso
  useEffect(() => {
    if (location.state && location.state.refrescar) {
      cargarProgreso();
      cargarCursosCompletados();
      
      // Mostrar mensaje si se completó un curso
      //if (location.state.cursoCompletado && location.state.mensaje) {
      //  alert(location.state.mensaje);
      //}
      
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
    if (estaCursoCompletado(curso.dbName)) {
      // Si el curso ya está completado, preguntar si quiere repasar
      if (window.confirm(`Ya completaste "${curso.name}". ¿Deseas repasarlo?`)) {
        navigate(curso.link, { state: { courseId: curso.id } });
      }
    } else {
      // Si no está completado, iniciar normalmente
      navigate(curso.link, { state: { courseId: curso.id } });
    }
  };

  return (
    <div className="container-fluid py-5 mt-5">
      
      <div className="container-wide">
        
        <div className="text-center mb-5">
          <h2 className="titulo-pagina">
            Plataforma de Capacitación Laboral
          </h2>
          <p className="subtitulo-pagina">
            Completa los cursos paso a paso y obtén tu certificación.
          </p>
        </div>

        {/* PROGRESO GENERAL */}
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
            
            return (
              <div key={curso.id} className="col-md-3">
                <div className={`card card-curso shadow-sm h-100 ${completado ? 'curso-completado' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="titulo-curso">
                        {curso.name}
                      </h5>
                      {completado && (
                        <span className="badge bg-success">
                          ✅
                        </span>
                      )}
                    </div>
                    <p className="descripcion-curso">
                      {curso.desc}
                    </p>
                    
                    {/* Estado del curso */}
                    <div className="mt-auto">
                      <div className="mb-2">
                        <small className={`badge ${completado ? 'bg-success' : 'bg-secondary'}`}>
                          {completado ? 'Completado' : 'Por comenzar'}
                        </small>
                        {completado && (
                          <small className="ms-2 text-success">
                            <i className="bi bi-check-circle"></i> Realizado
                          </small>
                        )}
                      </div>
                      
                      <button
                        className={`btn w-100 ${completado ? 'btn-success' : 'btn-iniciar'}`}
                        onClick={() => manejarClicCurso(curso)}
                      >
                        {completado ? (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Curso realizado
                          </>
                        ) : (
                          'Iniciar curso'
                        )}
                      </button>
                      
                      {/* Botón para repasar incluso si está completado */}
                      {completado && (
                        <button
                          className="btn btn-outline-primary w-100 mt-2"
                          onClick={() => navigate(curso.link, { state: { courseId: curso.id, repasar: true } })}
                        >
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Repasar curso
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen de progreso */}
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

        {/* PRUEBA FINAL */}
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
                Ir a la prueba final 📝
              </button>
            )
          ) : (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              La prueba final se habilitará cuando completes todos los cursos ({courses.filter(c => estaCursoCompletado(c.dbName)).length}/{courses.length} completados).
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
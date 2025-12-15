import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nivel from "./nivel";
import "../../styles/cursos/curso1.css";

export default function Curso({ curso }) {

  const API_URL = import.meta.env.VITE_API_URL;
  const _location = useLocation();
  const navigate = useNavigate();
  
  const _courseId = curso.id;
  const nombreCursoBD = "derechos_laborales"; 
  
  const nombre = localStorage.getItem("usuario");

  const [niveles, setNiveles] = useState(curso.niveles);
  const [cargando, setCargando] = useState(true);
  const [courseCompletedFromDB, setCourseCompletedFromDB] = useState(false);
  const [cursoMarcadoCompletado, setCursoMarcadoCompletado] = useState(false);

  const total = niveles.length;
  const completados = niveles.filter(n => n.completado).length;
  const progreso = Math.round((completados / total) * 100);

  // CARGAMOS ÍTEMS COMPLETADOS DE LA BD
  useEffect(() => {
    const cargarProgresoBD = async () => {
      try {
        // Cargar ítems completados de progreso_cursos
        const res = await fetch(`${API_URL}/api/progreso/items/${nombre}/${nombreCursoBD}`);
        const data = await res.json();

        const itemsGuardados = data.completados || [];

        const nuevosNiveles = niveles.map(nivel =>
          itemsGuardados.includes(nivel.id)
            ? { ...nivel, completado: true }
            : nivel
        );

        setNiveles(nuevosNiveles);

        // Determinar si el curso ya está completado en la BD (progreso_cursos)
        const nivelIds = niveles.map(n => n.id);
        const allCompleted = nivelIds.every(id => itemsGuardados.includes(id));
        setCourseCompletedFromDB(allCompleted);
        
        // Verificar si ya está marcado como curso completado en cursos_completados
        const resCursoCompletado = await fetch(`${API_URL}/api/progreso/curso-completado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            curso: nombreCursoBD
          })
        });
        
        const dataCursoCompletado = await resCursoCompletado.json();
        if (dataCursoCompletado.ok && dataCursoCompletado.completado) {
          setCursoMarcadoCompletado(true);
        }
        
      } catch (error) {
        console.error("Error cargando progreso interno:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarProgresoBD();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GUARDAR ÍTEM COMPLETADO EN BD
  const guardarItemEnBD = async (itemId) => {
    try {
      await fetch(`${API_URL}/api/progreso/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          curso: nombreCursoBD,
          item_id: itemId
        })
      });
    } catch (error) {
      console.error("Error guardando item:", error);
    }
  };

  // MARCAR CURSO COMO COMPLETADO EN LA BD
  const marcarCursoCompletadoEnBD = useCallback(async () => {
    try {
      console.log("Marcando curso como completado en BD...");
      
      // Enviar el total de niveles del curso
      const totalItems = niveles.length;
      
      const response = await fetch(`${API_URL}/api/progreso/marcar-curso-completado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          curso: nombreCursoBD,
          totalItems: totalItems
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.ok) {
        console.log("✅ Curso marcado como completado:", result);
        setCursoMarcadoCompletado(true);
        
        // Actualizar localStorage
        const cursosCompletados = JSON.parse(localStorage.getItem("cursosCompletados") || "{}");
        cursosCompletados[nombreCursoBD] = true;
        localStorage.setItem("cursosCompletados", JSON.stringify(cursosCompletados));
        
        return true;
      } else {
        console.log("El curso aún no está completo o ya estaba marcado:", result);
        return false;
      }
    } catch (error) {
      console.error("Error marcando curso como completado:", error);
      return false;
    }
  }, [nombre, nombreCursoBD, niveles.length]);

  // SUMAR 25% AL PROGRESO GENERAL CUANDO SE COMPLETA EL CURSO
  const sumarProgresoGeneral = useCallback(async () => {
    try {
      const prev = parseInt(localStorage.getItem("progreso") || "0");
      const nuevoProgreso = Math.min(prev + 25, 100);

      await fetch(`${API_URL}/api/progreso/update-general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre,
          nuevoProgreso
        })
      });

      localStorage.setItem("progreso", nuevoProgreso);
    } catch (error) {
      console.error("Error actualizando progreso general:", error);
    }
  }, [nombre]);

  // DETECTAR FINAL DEL CURSO Y MARCAR COMO COMPLETADO
  useEffect(() => {
    const finalizarCurso = async () => {
      if (progreso === 100 && !cargando && !cursoMarcadoCompletado) {
        console.log("¡Curso completado al 100%! Procesando...");
        
        // Primero marcar el curso como completado en la BD
        const cursoMarcado = await marcarCursoCompletadoEnBD();
        
        if (cursoMarcado) {
          // Solo sumar progreso general si es la primera vez que se completa
          if (!courseCompletedFromDB) {
            await sumarProgresoGeneral();
            setCourseCompletedFromDB(true);
          }
          
          // Redirigir después de un breve retraso
          setTimeout(() => {
            navigate("/courses", { 
              replace: true, 
              state: { 
                refrescar: true,
                cursoCompletado: nombreCursoBD,
                mensaje: `🎉 ¡Felicidades! Has completado el curso "${curso.nombre}"`
              } 
            });
          }, 1000);
        }
      }
    };

    finalizarCurso();
  }, [progreso, cargando, cursoMarcadoCompletado, courseCompletedFromDB, navigate, sumarProgresoGeneral, marcarCursoCompletadoEnBD, curso.nombre, nombreCursoBD]);

  // MARCAR NIVEL COMPLETADO (frontend + backend)
  const marcarCompletado = (nivelId) => {
    setNiveles(prevNiveles =>
      prevNiveles.map(nivel =>
        nivel.id === nivelId ? { ...nivel, completado: !nivel.completado } : nivel
      )
    );

    guardarItemEnBD(nivelId);
  };

  // RENDERIZAMOS
  if (cargando) {
    return <div className="text-center mt-5">Cargando progreso...</div>;
  }

  return (
    <div className="contenedor-principal">
      <div className="container-fluid py-5 mt-5 pt-5">

        {/* TÍTULO */}
        <div className="mb-4 text-center">
          <h2 className="fw-bold text-primary display-5 titulo-curso-page">
            {curso.nombre}
          </h2>

          <p className="text-muted lead descripcion-curso-page">
            {curso.descripcion}
          </p>
          <p className="text-muted lead descripcion-curso-page2">
            {curso.descripcion2}
          </p>
          <div className="mt-3">
            {courseCompletedFromDB || cursoMarcadoCompletado ? (
              <button
                className="btn btn-success"
                onClick={() => {
                  const first = document.querySelector('.niveles-contenedor .card');
                  if (first) first.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ✅ Curso realizado — Ver contenido
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const first = document.querySelector('.niveles-contenedor .card');
                  if (first) first.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ▶ Iniciar curso
              </button>
            )}
          </div>
        </div>

        {/* PROGRESO */}
        <div className="progress-box mb-5">
          <label className="form-label fw-semibold fs-5 mb-2">Progreso del curso</label>

          <div className="progress progress-curso">
            <div
              className={`progress-bar progress-bar-striped progress-bar-animated 
                ${progreso === 100 ? "bg-success" : "bg-info"}`}
              style={{ width: `${progreso}%` }}
            >
              {progreso}%
            </div>
          </div>
          <div className="mt-2 text-center">
            <small className="text-muted">
              {completados} de {total} niveles completados
              {progreso === 100 && !cursoMarcadoCompletado && (
                <span className="ms-2 text-warning">
                  <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                  Procesando finalización...
                </span>
              )}
            </small>
          </div>
        </div>

        {/* NIVELES */}
        <div className="niveles-contenedor">
          {niveles.map((nivel, idx) => {
            const puedeAcceder = idx === 0 || niveles[idx - 1].completado;

            return (
              <Nivel
                key={nivel.id}
                nivel={nivel}
                puedeAcceder={puedeAcceder}
                marcarCompletado={marcarCompletado}
              />
            );
          })}
        </div>

        {progreso === 100 && (
          <div className="alert alert-success text-center mt-5 shadow-sm rounded-pill py-3 fs-5">
            🎉 ¡Has completado este curso!
          </div>
        )}

      </div>
    </div>
  );
}
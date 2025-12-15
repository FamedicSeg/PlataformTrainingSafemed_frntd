import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nivel from "./nivel4";
import "../../styles/cursos/curso1.css";

export default function Curso4({ curso }) {
  const _location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  
  const _courseId = curso.id;
  const nombreCursoBD = "otrosRelacionados"; 
  const nombre = localStorage.getItem("usuario");
  
  const [niveles, setNiveles] = useState(curso.niveles);
  const [cargando, setCargando] = useState(true);
  const [courseCompletedFromDB, setCourseCompletedFromDB] = useState(false);
  const [cursoMarcadoCompletado, setCursoMarcadoCompletado] = useState(false);
  const [mostrarProcesando, setMostrarProcesando] = useState(false);
  
  const total = niveles.length;
  const completados = niveles.filter(n => n.completado).length;
  const progreso = Math.round((completados / total) * 100);
  
  // CARGAMOS ÍTEMS COMPLETADOS DE LA BD
  useEffect(() => {
    const cargarProgresoBD = async () => {
      try {
        const res = await fetch(`${API_URL}/api/progreso/items/${nombre}/${nombreCursoBD}`);
        const data = await res.json();
        const itemsGuardados = data.completados || [];
        
        const nuevosNiveles = niveles.map(nivel =>
          itemsGuardados.includes(nivel.id)
            ? { ...nivel, completado: true }
            : nivel
        );
        
        setNiveles(nuevosNiveles);
        
        const nivelIds = niveles.map(n => n.id);
        const allCompleted = nivelIds.every(id => itemsGuardados.includes(id));
        setCourseCompletedFromDB(allCompleted);
        
        const resCursoCompletado = await fetch(`${API_URL}/api/progreso/curso-completado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, curso: nombreCursoBD })
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
        body: JSON.stringify({ nombre, curso: nombreCursoBD, item_id: itemId })
      });
    } catch (error) {
      console.error("Error guardando item:", error);
    }
  };
  
  // MARCAR CURSO COMO COMPLETADO EN LA BD (CORREGIDO)
  const marcarCursoCompletadoEnBD = useCallback(async () => {
    try {
      console.log("Marcando curso como completado en BD...");
      
      const response = await fetch(`${API_URL}/api/progreso/marcar-curso-completado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          curso: nombreCursoBD,
          totalItems: niveles.length
        })
      });
      
      const result = await response.json();
      console.log("📨 Respuesta del backend:", result);
      
      if (response.ok && result.ok) {
        console.log("✅ Curso marcado como completado:", result);
        
        // ACTUALIZAR TODOS LOS ESTADOS 
        setCursoMarcadoCompletado(true);
        setCourseCompletedFromDB(true);
        
        // Actualizar localStorage
        const cursosCompletados = JSON.parse(localStorage.getItem("cursosCompletados") || "{}");
        cursosCompletados[nombreCursoBD] = true;
        localStorage.setItem("cursosCompletados", JSON.stringify(cursosCompletados));
        
        // LLAMAR A SUMAR PROGRESO GENERAL
        const prev = parseInt(localStorage.getItem("progreso") || "0");
        const nuevoProgreso = Math.min(prev + 25, 100);
        
        try {
          await fetch(`${API_URL}/api/progreso/update-general`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, nuevoProgreso })
          });
          localStorage.setItem("progreso", nuevoProgreso);
          console.log("✅ Progreso general actualizado a:", nuevoProgreso + "%");
        } catch (error) {
          console.error("Error actualizando progreso general:", error);
        }
        
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
  
  // VERIFICACIÓN PERIÓDICA SI EL CURSO YA ESTÁ COMPLETADO
  useEffect(() => {
    const verificarCursoCompletado = async () => {
      if (progreso === 100 && !cursoMarcadoCompletado) {
        try {
          console.log("🔍 Verificando si curso ya está completado en BD...");
          
          const res = await fetch(`${API_URL}/api/progreso/curso-completado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, curso: nombreCursoBD })
          });
          
          const data = await res.json();
          if (data.ok && data.completado) {
            console.log("✅ Curso YA está marcado como completado en BD");
            setCursoMarcadoCompletado(true);
            setCourseCompletedFromDB(true);
          }
        } catch (error) {
          console.error("Error verificando curso completado:", error);
        }
      }
    };
    
    let intervalId;
    if (progreso === 100 && !cursoMarcadoCompletado) {
      intervalId = setInterval(verificarCursoCompletado, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [progreso, cursoMarcadoCompletado, nombre, nombreCursoBD]);
  
  // DETECTAR FINAL DEL CURSO Y MARCAR COMO COMPLETADO
  useEffect(() => {
    const finalizarCurso = async () => {
      if (progreso === 100 && !cargando && !cursoMarcadoCompletado) {
        console.log("¡Curso completado al 100%! Procesando...");
        setMostrarProcesando(true);
        
        const procesandoTimeout = setTimeout(() => {
          setMostrarProcesando(false);
          console.log("⏰ Timeout: Ocultando 'Procesando finalización...'");
        }, 1000);
        
        const cursoMarcado = await marcarCursoCompletadoEnBD();
        clearTimeout(procesandoTimeout);
        
        if (cursoMarcado) {
          setMostrarProcesando(false);
          
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
        } else {
          setMostrarProcesando(false);
        }
      }
    };
    
    finalizarCurso();
  }, [progreso, cargando, cursoMarcadoCompletado, navigate, marcarCursoCompletadoEnBD, curso.nombre, nombreCursoBD]);
  
  //   6. MARCAR NIVEL COMPLETADO
  const marcarCompletado = (nivelId) => {
    setNiveles(prevNiveles =>
      prevNiveles.map(nivel =>
        nivel.id === nivelId ? { ...nivel, completado: !nivel.completado } : nivel
      )
    );
    guardarItemEnBD(nivelId);
  };
  
  //   RENDER
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
              <div>
                <button
                  className="btn btn-success me-2"
                  onClick={() => {
                    const first = document.querySelector('.niveles-contenedor .card');
                    if (first) first.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  ✅ Curso realizado — Ver contenido
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Actualizar estado
                </button>
              </div>
            ) : (
              <div>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => {
                    const first = document.querySelector('.niveles-contenedor .card');
                    if (first) first.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  ▶ Iniciar curso
                </button>
                {progreso === 100 && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={async () => {
                      console.log("Forzando marcado de curso...");
                      const resultado = await marcarCursoCompletadoEnBD();
                      if (resultado) {
                        alert("¡Curso marcado como completado!");
                        window.location.reload();
                      }
                    }}
                  >
                    🛠 Forzar completado
                  </button>
                )}
              </div>
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
              
              {/* SOLO UNA CONDICIÓN */}
              {mostrarProcesando && (
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
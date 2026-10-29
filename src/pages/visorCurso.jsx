import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Nivel from '../cursos/TalentoHumano/curso1/nivel';
import { supabase } from '../lib/supabase';
import { esCursoExpiradoSeguro } from '../utils/dateUtils';
import '../styles/cursos/curso1.css';

// VisorCurso - Página para ver el contenido de un curso dinámico
//Estructura visual idéntica a los cursos estáticos con componente Nivel

export default function VisorCurso() {
  const navigate = useNavigate();
  const { cursoId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [inscripcion, setInscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cursoMarcadoCompletado, setCursoMarcadoCompletado] = useState(false);
  const [token, setToken] = useState(null);
  const [asistenciasVideoconferencia, setAsistenciasVideoconferencia] = useState({});
  const [loadingVideoconferencia, setLoadingVideoconferencia] = useState({});
  const [tieneEvaluacion, setTieneEvaluacion] = useState(false);

  // ✅ Función para obtener URL pública de Supabase
  const obtenerUrlSupabase = (path) => {
    if (!path) return null;
    
    // Si ya es una URL completa (http:// o https://), devolverla
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log('🔗 URL ya es completa:', path);
      return path;
    }
    
    // Si es un path de Supabase, obtener la URL pública
    try {
      const { data } = supabase.storage
        .from('modulos')
        .getPublicUrl(path);
      console.log('🔗 URL generada desde Supabase:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error obteniendo URL de Supabase:', error);
      return null;
    }
  };

  // Cargar datos del curso
  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  const cargarCurso = async () => {
    try {
      // ✅ Obtener token y usuario DENTRO del useEffect (cuando localStorage está actualizado)
      const tokenFromStorage = localStorage.getItem("user_token");
      const usuarioFromStorage = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');

      if (!tokenFromStorage || !usuarioFromStorage.id) {
        console.error('❌ Token o usuario no encontrado');
        setLoading(false);
        navigate('/login');
        return;
      }

      setToken(tokenFromStorage);

      setLoading(true);
      const inscripcionesRes = await fetch(`${API_URL}/api/inscripciones/usuario/${usuarioFromStorage.id}`, {
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });
      const inscripcionesData = await inscripcionesRes.json();
      const inscripcionCurso = inscripcionesData.data?.find(i => i.curso_id === parseInt(cursoId));
      setInscripcion(inscripcionCurso);

      // ✅ BLOQUEAR ACCESO si el usuario NO está inscrito en este curso
      if (!inscripcionCurso) {
        setLoading(false);
        await Swal.fire({
          icon: 'warning',
          title: 'Acceso Denegado',
          text: 'No estás inscrito en este curso. Regresa a mis cursos para ver los cursos asignados.',
          confirmButtonText: 'Volver'
        });
        navigate('/cursos-disponibles');
        return;
      }

      // Bloquear acceso si el curso ha expirado y el usuario no lo completó
      if (inscripcionCurso?.fecha_fin_curso && esCursoExpiradoSeguro(inscripcionCurso.fecha_fin_curso) && inscripcionCurso.estado !== 'completado') {
        setLoading(false);
        await Swal.fire({
          icon: 'error',
          title: 'Curso Expirado',
          text: 'El tiempo de este curso ha finalizado y no lo completaste a tiempo.',
          confirmButtonText: 'Volver a mis cursos'
        });
        navigate('/procesos');
        return;
      }

      // ✅ PASO 2: Ahora sí cargar los módulos (solo si está inscrito)
      const modulosRes = await fetch(`${API_URL}/api/modulos/curso/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });
      const modulosData = await modulosRes.json();
      
      console.log('📦 Datos de módulos recibidos:', modulosData);

      if (modulosData.success) {
        // Convertir módulos a formato de niveles
        const nivelesFormateados = (modulosData.data || []).map((modulo, idx) => {
          // ✅ Si la URL es de Supabase, obtener la URL pública
          const urlPublica = modulo.url ? obtenerUrlSupabase(modulo.url) : null;
          
          console.log(`📹 Módulo ${idx + 1}:`, {
            titulo: modulo.titulo,
            tipo: modulo.tipo,
            url_original: modulo.url,
            url_publica: urlPublica
          });

          return {
            id: `modulo_${modulo.id}`,
            modulo_id: modulo.id,
            titulo: modulo.titulo,
            descripcion: modulo.descripcion || '',
            tipo: modulo.tipo === 'mp4' ? 'video' : modulo.tipo,
            url: urlPublica || modulo.url, // ✅ Usar URL pública si es de Supabase
            url_conferencia: modulo.url_conferencia,
            fecha_inicio_conferencia: modulo.fecha_inicio_conferencia,
            fecha_fin_conferencia: modulo.fecha_fin_conferencia,
            contenido: modulo.contenido,
            completado: false,
            orden: idx
          };
        });
        setModulos(nivelesFormateados);
        console.log('✅ Módulos formateados:', nivelesFormateados);
      }

      // ✅ PASO 3: Cargar info del curso y progreso
        setCurso({
          id: parseInt(cursoId),
          nombre: inscripcionCurso.curso_nombre,
          descripcion: inscripcionCurso.descripcion || '',
          descripcion2: inscripcionCurso.descripcion_larga || ''
        });

      // Cargar progreso de módulos guardado
      try {
        const progresoRes = await fetch(
          `${API_URL}/api/progreso-modulos/modulos-completados/${usuarioFromStorage.id}/${cursoId}`,
          {
            headers: {
              'Authorization': `Bearer ${tokenFromStorage}`
            }
          }
        );
        const progresoData = await progresoRes.json();
        
        if (progresoData.success && progresoData.data) {
          const modulosCompletados = progresoData.data;
          setModulos(prevModulos =>
            prevModulos.map(modulo =>
              modulosCompletados.includes(modulo.modulo_id)
                ? { ...modulo, completado: true }
                : modulo
            )
          );
        }
      } catch (error) {
        console.error('Error cargando progreso:', error);
      }

      // Si el estado es 'no iniciado', cambiar a 'en progreso'
      if (inscripcionCurso.estado === 'no iniciado') {
        try {
          const updateRes = await fetch(`${API_URL}/api/inscripciones/${inscripcionCurso.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenFromStorage}`
            },
            body: JSON.stringify({ estado: 'en progreso' })
          });

          if (updateRes.ok) {
            setInscripcion(prev => ({ ...prev, estado: 'en progreso' }));
          }
        } catch (error) {
          console.error('Error al actualizar estado:', error);
        }
      }

      // Si ya estaba completado, no volver a disparar la navegación a la prueba
      if (inscripcionCurso.estado === 'completado') {
        setCursoMarcadoCompletado(true);
      }

      // ✅ NUEVO: Verificar si el curso tiene evaluación
      try {
        const evaluacionRes = await fetch(
          `${API_URL}/api/evaluaciones/curso/${cursoId}`,
          {
            headers: {
              'Authorization': `Bearer ${tokenFromStorage}`
            }
          }
        );
        const evaluacionData = await evaluacionRes.json();
        
        if (evaluacionData.data && evaluacionData.data.length > 0) {
          console.log('✅ Evaluación encontrada:', evaluacionData.data[0]);
          setTieneEvaluacion(true);
        } else {
          console.log('ℹ️ No hay evaluación para este curso');
          setTieneEvaluacion(false);
        }
      } catch (error) {
        console.error('Error verificando evaluación:', error);
        setTieneEvaluacion(false);
      }

      setLoading(false);
    } catch(error){
      console.error('Error en la sección principal del visor de curso:', error);
      setLoading(false);
    }
  };

  // Marcar nivel completado y guardar en BD
  const marcarCompletado = async (nivelId) => {
    // Obtener modulo_id real del nivel
    const modulo = modulos.find(m => m.id === nivelId);
    if (!modulo) return;

    const moduloId = modulo.modulo_id;
    const estaCompletado = modulo.completado;

    // Actualizar estado local primero
    setModulos(prevModulos =>
      prevModulos.map(m =>
        m.id === nivelId ? { ...m, completado: !m.completado } : m
      )
    );

    // Guardar o eliminar en la BD
    try {
      if (!estaCompletado) {
        // Marcar como completado
        await fetch(`${API_URL}/api/progreso-modulos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            modulo_id: moduloId,
            curso_id: parseInt(cursoId)
          })
        });
      } else {
        // Desmarcar como completado
        await fetch(`${API_URL}/api/progreso-modulos`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            modulo_id: moduloId
          })
        });
      }
    } catch (error) {
      console.error('Error guardando progreso:', error);
      // Revertir cambio local si falla
      setModulos(prevModulos =>
        prevModulos.map(m =>
          m.id === nivelId ? { ...m, completado: estaCompletado } : m
        )
      );
    }
  };

  const unirseVideoconferencia = async (nivel) => {
    if (!nivel || nivel.tipo !== 'video_conferencia') return;

    const usuario = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    setLoadingVideoconferencia(prev => ({ ...prev, [nivel.modulo_id]: true }));

    try {
      const response = await fetch(
        `${API_URL}/api/modulos/${nivel.modulo_id}/registrar-asistencia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
          },
          body: JSON.stringify({ usuario_id: usuario.id })
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar la asistencia');
      }

      setAsistenciasVideoconferencia(prev => ({
        ...prev,
        [nivel.modulo_id]: true
      }));

      if (!nivel.completado) {
        await marcarCompletado(nivel.id);
      }

      const url = nivel.url_conferencia || `https://meet.jitsi.org/${nivel.modulo_id}-${usuario.id}`;
      Swal.fire({
        title: 'Abriendo videoconferencia',
        text: 'Se abrirá la sala en una nueva ventana.',
        icon: 'info',
        timer: 1800,
        timerProgressBar: true,
        didClose: () => window.open(url, '_blank', 'noopener,noreferrer')
      });
    } catch (error) {
      console.error('Error al unirse a la videoconferencia:', error);
      Swal.fire('Error', error.message || 'No se pudo conectar a la videoconferencia', 'error');
    } finally {
      setLoadingVideoconferencia(prev => ({ ...prev, [nivel.modulo_id]: false }));
    }
  };

  // Calcular progreso
  // La videoconferencia es opcional: no cuenta para el progreso
  const modulosContables = modulos.filter(m => m.tipo !== 'video_conferencia');
  const total = modulosContables.length;
  const completados = modulosContables.filter(m => m.completado).length;
  const progreso = total > 0 ? Math.round((completados / total) * 100) : 0;

  // ✅ Función VOLVER como botón de Windows (solo regresa a la página anterior)
  const handleVolver = () => {
    const token = localStorage.getItem("user_token");
    const usuario = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');
    
    if (!token || !usuario.id) {
      navigate('/');
      return;
    }
    
    // Si el curso fue completado, marcar en sessionStorage para que la
    // página de cursos refresque el estado al volver
    if (cursoMarcadoCompletado || progreso === 100) {
      sessionStorage.setItem('refrescarCursosCompletados', 'true');
    }
    
    console.log('🔙 Volviendo a la página anterior');
    navigate(-1);
  };

  // Función para obtener la ruta según el proceso
  {/*
  const obtenerRutaProceso = useCallback(() => {
    if (!inscripcion) return '/cursos-disponibles';
    
    const proceso = inscripcion.proceso || '';
    
    const rutasProcesos = {
      'talento humano': '/courses/tthh',
      'tthh': '/courses/tthh',
      'talento_humano': '/courses/tthh',
      'dirección': '/courses/direccion',
      'direccion': '/courses/direccion',
      'ventas': '/courses/ventas',
      'desarrollo e investigación': '/courses/desarrollo-e-investigacion',
      'desarrollo_e_investigacion': '/courses/desarrollo-e-investigacion',
      'compras': '/courses/compras',
      'producción': '/courses/produccion',
      'produccion': '/courses/produccion',
      'control de calidad': '/courses/control-de-calidad',
      'control_de_calidad': '/courses/control-de-calidad',
      'almacenamiento y logística': '/courses/almacenamiento-y-logistica',
      'almacenamiento_y_logistica': '/courses/almacenamiento-y-logistica',
      'sgcs': '/courses/sgcs',
      'marketing': '/courses/marketing',
      'salud ocupacional': '/courses/salud-ocupacional',
      'salud_ocupacional': '/courses/salud-ocupacional',
      'seguridad industrial': '/courses/seguridad-industrial',
      'seguridad_industrial': '/courses/seguridad-industrial',
      'seguridad informática': '/courses/seguridad-informatica',
      'seguridad_informatica': '/courses/seguridad-informatica',
    };
    
    const procesoNormalizado = proceso.toLowerCase().trim();
    return rutasProcesos[procesoNormalizado] || '/cursos-disponibles';
  }, [inscripcion]); */}

  // Marcar curso como completado
  // 🔧 CAMBIO: Solo marcar como completado si NO hay evaluación
  // Si hay evaluación, esperar a que se apruebe primero
  useEffect(() => {
    const finalizarCurso = async () => {
      if (progreso === 100 && !loading && !cursoMarcadoCompletado && inscripcion) {
        // Si el curso tiene evaluación, NO marcarlo como completado automáticamente
        // Se marcará como completado solo después de que el usuario apruebe la evaluación
        if (tieneEvaluacion) {
          console.log('📋 Evaluación encontrada. Esperando a que sea aprobada...');
          return;
        }

        // Si NO hay evaluación, marcar como completado de inmediato
        try {
          const response = await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: 'completado' })
          });

          if (response.ok) {
            setCursoMarcadoCompletado(true);
            console.log('✅ Curso marcado como completado (sin evaluación)');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    finalizarCurso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progreso, loading, cursoMarcadoCompletado, inscripcion, API_URL, token, tieneEvaluacion]);

  // Controlar acceso secuencial a niveles
  const puedeAccederNivel = (index) => {
    if (index === 0) return true;
    // Los módulos de videoconferencia no bloquean los siguientes
    for (let i = index - 1; i >= 0; i--) {
      if (modulos[i].tipo === 'video_conferencia') continue;
      return !!modulos[i].completado;
    }
    return true;
  };

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
        <div className="alert alert-warning">No se encontró el curso. Regresa a la página anterior</div>
      </div>
    );
  }

  return (
    <div className="contenedor-principal">
      <div className="contenedor-vista-curso-principal" style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* ✅ BOTÓN VOLVER - Como botón de Windows */}
        <div className="mb-4">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleVolver}
          >
            ← Volver
          </button>
        </div>

        {/* TÍTULO */}
        <div className="mb-4 text-center">
          <h2 className="fw-bold text-primary display-5 titulo-curso-page">
            {curso.nombre}
          </h2>

          
          {curso.descripcion2 && (
            <p className="text-muted lead descripcion-curso-page2">
              {curso.descripcion2}
            </p>
          )}
          {/*
          <div className="mt-3">
            {cursoMarcadoCompletado ? (
              <button
                className="btn btn-success"
                onClick={() => {
                  const first = document.querySelector('.niveles-contenedor .card');
                  if (first) first.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ✅ Curso completado — Ver contenido
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
          */}
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
              {completados} de {total} módulos completados
              {progreso === 100 && !cursoMarcadoCompletado && (
                <span className="ms-2 text-warning">
                  <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                  Procesando finalización...
                </span>
              )}
            </small>
          </div>
        </div>

        {/* 🔧 INDICADOR: Evaluación Pendiente */}
        {tieneEvaluacion && !cursoMarcadoCompletado && progreso === 100 && (
          <div className="alert alert-info d-flex align-items-center gap-3 mb-5 border-2 border-info" role="alert">
            <div className="fs-5">📋</div>
            <div className="flex-grow-1">
              <strong>Evaluación pendiente</strong>
              <p className="mb-0 mt-1 small">
                Has completado todos los módulos. Ahora debes realizar la evaluación final para completar este curso.
              </p>
            </div>
          </div>
        )}

        {/* MÓDULOS */}
        <div className="niveles-contenedor">
          {modulos.map((modulo, idx) => {
            const puedeAcceder = puedeAccederNivel(idx);

            // ✅ Log para ver cada módulo renderizado
            console.log(`🎬 Renderizando módulo ${idx + 1}:`, {
              titulo: modulo.titulo,
              tipo: modulo.tipo,
              url: modulo.url,
              tieneUrl: !!modulo.url
            });

            return (
              <Nivel
                key={modulo.id}
                nivel={modulo}
                puedeAcceder={puedeAcceder}
                marcarCompletado={marcarCompletado}
                onJoinConference={unirseVideoconferencia}
                conferenceLoading={!!loadingVideoconferencia[modulo.modulo_id]}
                conferenceAttended={!!asistenciasVideoconferencia[modulo.modulo_id]}
              />
            );
          })}
        </div>

        {progreso === 100 && cursoMarcadoCompletado && (
          <div className="alert alert-success text-center mt-5 shadow-sm rounded-pill py-3 fs-5">
            ¡Felicidades! Has completado este curso...
          </div>
        )}

        {/* BOTÓN MANUAL — por si el Swal fue cerrado o el curso ya estaba completado */}
        {progreso === 100 && tieneEvaluacion && (
          <div className="text-center mt-4 mb-5">
            <button
              className="btn btn-success btn-lg px-5 py-3 shadow"
              onClick={() => navigate('/prueba-proceso', { state: { courseId: parseInt(cursoId) } })}
            >
              Ir a la Prueba Final
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
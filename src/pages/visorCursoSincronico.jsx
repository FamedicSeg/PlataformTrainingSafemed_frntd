import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import SalaJitsiMeet from '../components/SalaJitsiMeet';
import { useJitsi } from '../context/JitsiContext';
import EvaluacionVisor from '../components/EvaluacionVisor';
import '../styles/pages/visorCursoSincronico.css';

export default function VisorCursoSincronico() {
  const navigate = useNavigate();
  const { startJitsiSession } = useJitsi();
  const { cursoId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const [curso, setCurso] = useState(null);
  const [inscripcion, setInscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jitsiActivo, setJitsiActivo] = useState(false);
  const [mostrarEvaluacion, setMostrarEvaluacion] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [enHorario, setEnHorario] = useState(false);
  const [proximamenteInicia, setProximamenteInicia] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);

  // Cargar datos del curso
  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  // Actualizar temporizador
  useEffect(() => {
    if (!curso || !curso.fecha_inicio) return;

    const interval = setInterval(() => {
      const ahora = new Date();
      const inicio = new Date(curso.fecha_inicio);
      const fin = new Date(curso.fecha_fin);

      const enHorarioActual = ahora >= inicio && ahora <= fin;
      setEnHorario(enHorarioActual);

      if (ahora < inicio) {
        const diff = inicio - ahora;
        const horas = Math.floor(diff / 3600000);
        const minutos = Math.floor((diff % 3600000) / 60000);
        setTiempoRestante(`${horas}h ${minutos}m`);
        setProximamenteInicia(diff < 3600000); // Menos de 1 hora
      } else {
        setProximamenteInicia(false);
        setTiempoRestante(null);
      }
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [curso]);

  const cargarCurso = async () => {
    try {
      const tokenFromStorage = localStorage.getItem("user_token");
      const usuarioFromStorage = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');

      if (!tokenFromStorage || !usuarioFromStorage.id) {
        console.error('❌ Token o usuario no encontrado');
        setLoading(false);
        navigate('/login');
        return;
      }

      setToken(tokenFromStorage);
      setUsuario(usuarioFromStorage);

      setLoading(true);

      // Obtener inscripciones del usuario
      const inscripcionesRes = await fetch(`${API_URL}/api/inscripciones/usuario/${usuarioFromStorage.id}`, {
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });
      const inscripcionesData = await inscripcionesRes.json();
      const inscripcionCurso = inscripcionesData.data?.find(i => i.curso_id === parseInt(cursoId));
      
      if (!inscripcionCurso) {
        setLoading(false);
        await Swal.fire({
          icon: 'warning',
          title: 'Acceso Denegado',
          text: 'No estás inscrito en este curso.',
          confirmButtonText: 'Volver'
        });
        navigate('/cursos-disponibles');
        return;
      }

      setInscripcion(inscripcionCurso);

      // Obtener detalles del curso
      const cursoRes = await fetch(`${API_URL}/api/cursos/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });
      const cursoData = await cursoRes.json();

      if (!cursoData.success || !cursoData.data) {
        throw new Error('No se pudo cargar el curso');
      }

      const cursoInfo = cursoData.data;

      // Validar que sea sincrónico
      if (cursoInfo.tipo !== 'Sincrónico') {
        setLoading(false);
        await Swal.fire({
          icon: 'error',
          title: 'Curso No Sincrónico',
          text: 'Este curso no es sincrónico.',
          confirmButtonText: 'Volver'
        });
        navigate('/cursos-disponibles');
        return;
      }

      setCurso(cursoInfo);

      // Verificar si está en horario
      const ahora = new Date();
      const inicio = new Date(cursoInfo.fecha_inicio);
      const fin = new Date(cursoInfo.fecha_fin);
      setEnHorario(ahora >= inicio && ahora <= fin);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error cargando curso:', error);
      setLoading(false);
      await Swal.fire('Error', 'No se pudo cargar el curso', 'error');
      navigate('/cursos-disponibles');
    }
  };

  const handleUnirseJitsi = async () => {
    // Iniciar sesión flotante de Jitsi
    startJitsiSession({
      cursoId,
      nombreCurso: curso.nombre,
      userEmail: usuario.email || usuario.cedula_identidad,
      userName: usuario.nombre,
      fechaInicio: curso.fecha_inicio
    });

    // También registrar entrada en el backend
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/asistencia/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId: usuario.id })
      });

      if (!res.ok) {
        throw new Error('Error registrando entrada');
      }

      console.log('✅ Entrada registrada');
    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      // Continuar aunque falle el registro
    }

    // Ya no necesitamos setJitsiActivo(true) porque la sesión es global
  };

  const handleCerrarJitsi = async () => {
    // Registrar salida
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/asistencia/salida`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId: usuario.id })
      });

      if (!res.ok) {
        throw new Error('Error registrando salida');
      }

      console.log('✅ Salida registrada');
    } catch (error) {
      console.error('❌ Error registrando salida:', error);
    }

    setJitsiActivo(false);
    // Mostrar evaluación si existe
    if (inscripcion.evaluacion_id) {
      setMostrarEvaluacion(true);
    }
  };

  const handleEvaluacionCompletada = () => {
    setMostrarEvaluacion(false);
    navigate('/cursos-disponibles', { state: { refrescar: true } });
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 mt-5" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando curso sincrónico...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container-fluid py-5 mt-5" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="alert alert-danger">Curso no encontrado</div>
      </div>
    );
  }

  // Mostrar evaluación
  if (mostrarEvaluacion && inscripcion.evaluacion_id) {
    return (
      <div className="container-fluid py-5 mt-5">
        <div className="container-wide" style={{ maxWidth: '900px' }}>
          <h2 className="titulo-pagina mb-4">Evaluación - {curso.nombre}</h2>
          <EvaluacionVisor
            cursoId={cursoId}
            evaluacionId={inscripcion.evaluacion_id}
            onCompletada={handleEvaluacionCompletada}
          />
        </div>
      </div>
    );
  }

  // Vista principal del curso sincrónico
  return (
    <div className="container-fluid py-5 mt-5">
      <div className="container-wide" style={{ maxWidth: '900px' }}>
        {/* Encabezado */}
        <div className="text-center mb-5">
          <h1 className="titulo-pagina">{curso.nombre}</h1>
          <p className="subtitulo-pagina">Conferencia Sincrónica en Vivo</p>
        </div>

        {/* Tarjeta principal */}
        <div className="card card-sincronico shadow-lg mb-4">
          <div className="card-body">
            {/* Información del curso */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="fw-bold text-primary mb-3">📋 Detalles del Curso</h5>
                <p><strong>Descripción:</strong> {curso.descripcion}</p>
                <p><strong>Objetivo:</strong> {curso.razon_curso}</p>
                <p><strong>Dirigido a:</strong> {curso.dirigido_a}</p>
              </div>

              <div className="col-md-6">
                <h5 className="fw-bold text-primary mb-3">🕐 Programación</h5>
                <div className="alert alert-info mb-3">
                  <p className="mb-2">
                    <strong>Inicio:</strong> {new Date(curso.fecha_inicio).toLocaleString('es-EC', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="mb-0">
                    <strong>Fin:</strong> {new Date(curso.fecha_fin).toLocaleString('es-EC', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Estado y botón de acción */}
            <div className="text-center">
              {enHorario ? (
                <>
                  <div className="alert alert-success mb-4">
                    <h5 className="mb-2">✅ La conferencia está en vivo</h5>
                    <p className="mb-0">¡Haz clic en el botón de abajo para unirte!</p>
                  </div>
                  <button
                    className="btn btn-unirse btn-lg"
                    onClick={handleUnirseJitsi}
                  >
                    Unirse
                  </button>
                </>
              ) : proximamenteInicia ? (
                <>
                  <div className="alert alert-warning mb-4">
                    <h5 className="mb-2">⏳ La conferencia comienza pronto</h5>
                    <p className="mb-0">Inicia en {tiempoRestante}</p>
                  </div>
                  <button className="btn btn-warning btn-lg" disabled>
                    ⏳ Próximamente ({tiempoRestante})
                  </button>
                </>
              ) : (
                <>
                  <div className="alert alert-secondary mb-4">
                    <h5 className="mb-2">🕐 Conferencia no disponible</h5>
                    <p className="mb-0">
                      {new Date() < new Date(curso.fecha_inicio)
                        ? `Disponible a partir del ${tiempoRestante}`
                        : 'Esta conferencia ya ha finalizado'}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-lg" disabled>
                    No Disponible
                  </button>
                </>
              )}
            </div>

            {/* Info adicional */}
            {inscripcion && (
              <div className="mt-4 pt-4 border-top">
                <p className="text-muted text-center mb-0">
                  <small>
                    Estatus: <strong>{inscripcion.estado || 'Pendiente'}</strong>
                    {inscripcion.mejor_puntaje && ` • Evaluación: ${inscripcion.mejor_puntaje}%`}
                  </small>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botón de regreso */}
        <div className="text-center">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/cursos-disponibles')}
          >
            ← Volver a Mis Capacitaciones
          </button>
        </div>
      </div>
    </div>
  );
}

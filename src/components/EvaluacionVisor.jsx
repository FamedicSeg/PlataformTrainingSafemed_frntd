import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lock, RotateCcw, Award } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/evaluacionVisor.css';

/**
 * EvaluacionVisor
 * Muestra la evaluación final del curso al usuario.
 * Aparece automáticamente cuando el progreso del curso llega a 100%.
 *
 * Props:
 *   cursoId    — ID del curso
 *   usuario    — objeto del usuario logueado { id, nombre }
 *   onClose    — callback para cerrar/minimizar
 */
export default function EvaluacionVisor({ cursoId, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('user_token');

  const [fase, setFase] = useState('cargando'); // cargando | sin-eval | info | tomando | resultado
  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPrguntas] = useState([]);
  const [estado, setEstado] = useState({ intentos_usados: 0, bloqueado: false, aprobado: false });
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // ── Carga ────────────────────────────────────────────────────
  useEffect(() => {
    cargarEvaluacion();
  }, [cursoId]);

  const cargarEvaluacion = async () => {
    try {
      setFase('cargando');

      // ¿Existe evaluación para este curso?
      const resLista = await fetch(`${API_URL}/api/evaluaciones/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataLista = await resLista.json();

      if (!dataLista.data || dataLista.data.length === 0) {
        setFase('sin-eval');
        return;
      }

      const evalBase = dataLista.data[0];

      // Cargar completa (con preguntas, sin respuestas correctas)
      const resCompleta = await fetch(
        `${API_URL}/api/evaluaciones/${evalBase.id}/completa`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const dataCompleta = await resCompleta.json();

      if (!dataCompleta.success) {
        setFase('sin-eval');
        return;
      }

      setEvaluacion(dataCompleta.data.evaluacion);
      setPrguntas(dataCompleta.data.preguntas);
      setEstado(dataCompleta.data.estado || { intentos_usados: 0, bloqueado: false, aprobado: false });

      setFase('info');
    } catch (err) {
      console.error('Error cargando evaluación:', err);
      setFase('sin-eval');
    }
  };

  // ── Iniciar prueba ───────────────────────────────────────────
  const iniciarPrueba = () => {
    setRespuestas({});
    setResultado(null);
    setFase('tomando');
  };

  // ── Seleccionar respuesta ────────────────────────────────────
  const seleccionarRespuesta = (preguntaId, opcionId) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcionId }));
  };

  // ── Enviar evaluación ────────────────────────────────────────
  const handleSubmit = async () => {
    // Verificar que todas las preguntas estén respondidas
    const sinResponder = preguntas.filter(p => !respuestas[p.id]);
    if (sinResponder.length > 0) {
      Swal.fire(
        'Preguntas sin responder',
        `Faltan ${sinResponder.length} pregunta(s) por responder.`,
        'warning'
      );
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Enviar evaluación?',
      text: 'Una vez enviada no podrás cambiar tus respuestas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Revisar',
    });

    if (!confirm.isConfirmed) return;

    try {
      setEnviando(true);

      const res = await fetch(
        `${API_URL}/api/evaluaciones/${evaluacion.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ curso_id: cursoId, respuestas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.bloqueado) {
          setEstado(prev => ({ ...prev, bloqueado: true }));
          setFase('info');
          return;
        }
        throw new Error(data.message);
      }

      setResultado(data.data);
      setEstado(prev => ({
        ...prev,
        intentos_usados: data.data.intentos_usados,
        bloqueado: data.data.bloqueado,
        aprobado: data.data.aprobado,
      }));
      setFase('resultado');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const totalPreguntas = preguntas.length;
  const respondidas = Object.keys(respuestas).length;
  const progresoPrueba = totalPreguntas > 0 ? Math.round((respondidas / totalPreguntas) * 100) : 0;

  // ── Renders por fase ─────────────────────────────────────────

  if (fase === 'cargando') {
    return (
      <div className="evisor-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">Cargando evaluación…</p>
        </div>
      </div>
    );
  }

  if (fase === 'sin-eval') {
    return null; // No hay evaluación configurada, no mostrar nada
  }

  if (fase === 'info') {
    const intentosRestantes = Math.max(0, 2 - estado.intentos_usados);

    return (
      <div className="evisor-container">
        <div className="evisor-card">

          {/* Encabezado */}
          <div className="evisor-header">
            <Award size={22} />
            <div>
              <h5 className="mb-0">{evaluacion?.titulo}</h5>
              <small>Evaluación final del curso</small>
            </div>
          </div>

          <div className="evisor-body">

            {/* Estado: aprobado */}
            {estado.aprobado && (
              <div className="evisor-estado aprobado">
                <CheckCircle size={28} />
                <div>
                  <strong>¡Ya aprobaste esta evaluación!</strong>
                  <p className="mb-0 mt-1 text-muted">
                    Felicitaciones. Has completado el curso exitosamente.
                  </p>
                </div>
              </div>
            )}

            {/* Estado: bloqueado */}
            {!estado.aprobado && estado.bloqueado && (
              <div className="evisor-estado bloqueado">
                <Lock size={28} />
                <div>
                  <strong>Has agotado tus intentos</strong>
                  <p className="mb-0 mt-1">
                    Solicita a <strong>Talento Humano</strong> que rehabilite tu evaluación para
                    poder volver a intentarla.
                  </p>
                </div>
              </div>
            )}

            {/* Estado: disponible */}
            {!estado.aprobado && !estado.bloqueado && (
              <>
                <div className="evisor-info-grid">
                  <div className="evisor-info-item">
                    <span className="label">Preguntas</span>
                    <span className="valor">{totalPreguntas}</span>
                  </div>
                  <div className="evisor-info-item">
                    <span className="label">Nota mínima</span>
                    <span className="valor">{evaluacion?.calificacion_minima}%</span>
                  </div>
                  <div className="evisor-info-item">
                    <span className="label">Intentos disponibles</span>
                    <span className="valor">
                      {intentosRestantes} de 2
                    </span>
                  </div>
                </div>

                {estado.intentos_usados > 0 && (
                  <div className="alert alert-warning d-flex align-items-center gap-2 py-2">
                    <RotateCcw size={16} />
                    <span>
                      Ya usaste <strong>{estado.intentos_usados}</strong> intento.
                      {intentosRestantes === 1
                        ? ' Este es tu último intento.'
                        : ''}
                    </span>
                  </div>
                )}

                <p className="evisor-instrucciones">
                  Responde todas las preguntas y envía la evaluación. Necesitas obtener al menos{' '}
                  <strong>{evaluacion?.calificacion_minima}%</strong> para aprobar.
                  Si no alcanzas el mínimo tienes un intento adicional.
                </p>

                <button className="btn btn-primary btn-lg w-100 mt-2" onClick={iniciarPrueba}>
                  {estado.intentos_usados === 0 ? 'Iniciar evaluación' : 'Reintentar evaluación'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (fase === 'tomando') {
    return (
      <div className="evisor-container">
        <div className="evisor-card evisor-card-wide">

          {/* Header */}
          <div className="evisor-header">
            <ClipboardIcon size={20} />
            <div className="flex-1">
              <h5 className="mb-0 titulo-evaluacion">{evaluacion?.titulo}</h5>
              <small>
                {respondidas}/{totalPreguntas} respondidas
              </small>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="evisor-progress-bar">
            <div className="evisor-progress-fill" style={{ width: `${progresoPrueba}%` }} />
          </div>

          {/* Preguntas */}
          <div className="evisor-preguntas">
            {preguntas.map((preg, idx) => (
              <div key={preg.id} className={`evisor-pregunta ${respuestas[preg.id] ? 'respondida' : ''}`}>
                <p className="preg-texto">
                  <span className="preg-num">{idx + 1}.</span> {preg.texto}
                </p>
                <div className="opciones-radio">
                  {preg.opciones.map(op => (
                    <label
                      key={op.id}
                      className={`opcion-radio-label ${respuestas[preg.id] === op.id ? 'seleccionada' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`pregunta_${preg.id}`}
                        value={op.id}
                        checked={respuestas[preg.id] === op.id}
                        onChange={() => seleccionarRespuesta(preg.id, op.id)}
                      />
                      {op.texto}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="evisor-footer">
            <button className="btn btn-outline-secondary" onClick={() => setFase('info')}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={enviando || respondidas < totalPreguntas}
            >
              {enviando
                ? 'Enviando…'
                : respondidas < totalPreguntas
                ? `Faltan ${totalPreguntas - respondidas} respuestas`
                : 'Enviar evaluación'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === 'resultado') {
    const aprobado = resultado?.aprobado;

    return (
      <div className="evisor-container">
        <div className="evisor-card">

          <div className="evisor-header">
            <Award size={22} />
            <h5 className="mb-0">Resultado de la evaluación</h5>
          </div>

          <div className="evisor-body text-center">

            {/* Ícono grande */}
            <div className={`evisor-resultado-icono ${aprobado ? 'aprobado' : 'reprobado'}`}>
              {aprobado ? <CheckCircle size={56} /> : <XCircle size={56} />}
            </div>

            {/* Puntaje */}
            <div className="evisor-puntaje">
              <span className="puntaje-num">{resultado?.puntaje}%</span>
            </div>

            {/* Mensaje */}
            <div className={`evisor-mensaje ${aprobado ? 'aprobado' : 'reprobado'}`}>
              {aprobado ? (
                <>
                  <strong>¡Aprobaste!</strong>
                  <p className="mb-0 mt-1">Has completado el curso exitosamente.</p>
                </>
              ) : (
                <>
                  <strong>No alcanzaste el mínimo</strong>
                  <p className="mb-0 mt-1">
                    {resultado?.intentos_restantes > 0
                      ? `Tienes ${resultado.intentos_restantes} intento más disponible.`
                      : 'Has agotado tus intentos. Solicita a Talento Humano que rehabilite tu evaluación.'}
                  </p>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="d-flex gap-2 justify-content-center mt-3">
              {!aprobado && resultado?.intentos_restantes > 0 && (
                <button className="btn btn-warning" onClick={() => { cargarEvaluacion(); }}>
                  <RotateCcw size={15} className="me-1" /> Reintentar
                </button>
              )}
              {onClose && (
                <button className="btn btn-outline-secondary" onClick={onClose}>
                  Volver al curso
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Ícono SVG inline para clipboard (evitar conflicto con lucide ClipboardList)
function ClipboardIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

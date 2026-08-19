import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, CheckCircle, ClipboardList, Grid3X3 } from 'lucide-react';
import Swal from 'sweetalert2';
import CrucigramaBuilder from './CrucigramaBuilder';
import '../styles/components/evaluacionManager.css';

/**
 * EvaluacionManager
 * Permite al admin del proceso crear/editar la evaluación final de un curso,
 * incluyendo preguntas con opciones de respuesta (una correcta).
 *
 * Props:
 *   cursoId  — ID del curso
 *   onClose  — callback para cerrar el modal
 */
export default function EvaluacionManager({ cursoId, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [pistasIniciales, setPistasIniciales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form: evaluación base
  const [formEval, setFormEval] = useState({ titulo: '', calificacion_minima: 70, tipo: 'opcion_multiple' });
  const [guardandoEval, setGuardandoEval] = useState(false);

  // Form: pregunta
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);
  const [formPregunta, setFormPregunta] = useState({ texto: '', opciones: iniciarOpciones() });
  const [guardandoPregunta, setGuardandoPregunta] = useState(false);

  function iniciarOpciones() {
    return [
      { texto: '', es_correcta: true },
      { texto: '', es_correcta: false },
      { texto: '', es_correcta: false },
      { texto: '', es_correcta: false },
    ];
  }

  // ── Carga inicial ────────────────────────────────────────────
  useEffect(() => {
    cargarEvaluacion();
  }, [cursoId]);

  const cargarEvaluacion = async () => {
    try {
      setLoading(true);

      // 1. ¿Existe evaluación para este curso?
      const resEval = await fetch(`${API_URL}/api/evaluaciones/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataEval = await resEval.json();

      if (dataEval.data && dataEval.data.length > 0) {
        const eval_ = dataEval.data[0];
        setEvaluacion(eval_);
        setFormEval({
          titulo: eval_.titulo,
          calificacion_minima: eval_.calificacion_minima,
          tipo: eval_.tipo || 'opcion_multiple',
        });

        if (eval_.tipo === 'crucigrama') {
          // Cargar pistas del crucigrama para edición
          const resCruci = await fetch(
            `${API_URL}/api/evaluaciones/${eval_.id}/crucigrama-pistas`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const dataCruci = await resCruci.json();
          if (dataCruci.success) {
            setPistasIniciales(
              dataCruci.data.map(p => ({ pista: p.pista, respuesta: p.respuesta }))
            );
          }
        } else {
          // Cargar preguntas con opciones (para editar)
          const resCompleta = await fetch(
            `${API_URL}/api/evaluaciones/${eval_.id}/para-editar`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const dataCompleta = await resCompleta.json();
          if (dataCompleta.success) {
            setPreguntas(dataCompleta.data.preguntas || []);
          }
        }
      } else {
        setEvaluacion(null);
        setPreguntas([]);
        setPistasIniciales([]);
      }
    } catch (err) {
      console.error('Error cargando evaluación:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar / actualizar evaluación base ────────────────────
  const handleGuardarEval = async (e) => {
    e.preventDefault();
    if (!formEval.titulo.trim()) {
      Swal.fire('Error', 'El título es requerido', 'error');
      return;
    }
    try {
      setGuardandoEval(true);
      let res, data;

      if (evaluacion) {
        // Actualizar
        res = await fetch(`${API_URL}/api/evaluaciones/${evaluacion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            titulo: formEval.titulo,
            calificacion_minima: Number(formEval.calificacion_minima),
            tipo: formEval.tipo,
          }),
        });
      } else {
        // Crear
        res = await fetch(`${API_URL}/api/evaluaciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            curso_id: cursoId,
            titulo: formEval.titulo,
            calificacion_minima: Number(formEval.calificacion_minima),
            tipo: formEval.tipo,
          }),
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire('Guardado', evaluacion ? 'Evaluación actualizada' : 'Evaluación creada', 'success');
      await cargarEvaluacion();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardandoEval(false);
    }
  };

  // ── Eliminar evaluación completa ────────────────────────────
  const handleEliminarEval = () => {
    Swal.fire({
      title: '¿Eliminar evaluación?',
      text: 'Se eliminarán todas las preguntas y el historial de intentos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`${API_URL}/api/evaluaciones/${evaluacion.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        Swal.fire('Eliminada', 'Evaluación eliminada', 'success');
        setEvaluacion(null);
        setPreguntas([]);
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    });
  };

  // ── Formulario de pregunta ───────────────────────────────────
  const abrirFormPregunta = (pregunta = null) => {
    if (pregunta) {
      setEditingPregunta(pregunta);
      setFormPregunta({
        texto: pregunta.texto,
        opciones: pregunta.opciones.map(o => ({ ...o })),
      });
    } else {
      setEditingPregunta(null);
      setFormPregunta({ texto: '', opciones: iniciarOpciones() });
    }
    setShowPreguntaForm(true);
  };

  const cerrarFormPregunta = () => {
    setShowPreguntaForm(false);
    setEditingPregunta(null);
  };

  const handleOpcionTexto = (idx, valor) => {
    setFormPregunta(prev => {
      const ops = [...prev.opciones];
      ops[idx] = { ...ops[idx], texto: valor };
      return { ...prev, opciones: ops };
    });
  };

  const handleOpcionCorrecta = (idx) => {
    setFormPregunta(prev => ({
      ...prev,
      opciones: prev.opciones.map((op, i) => ({ ...op, es_correcta: i === idx })),
    }));
  };

  const agregarOpcion = () => {
    if (formPregunta.opciones.length >= 6) return;
    setFormPregunta(prev => ({
      ...prev,
      opciones: [...prev.opciones, { texto: '', es_correcta: false }],
    }));
  };

  const eliminarOpcion = (idx) => {
    if (formPregunta.opciones.length <= 2) return;
    setFormPregunta(prev => {
      const ops = prev.opciones.filter((_, i) => i !== idx);
      // Si se eliminó la correcta, marcar la primera
      const hayCorrecta = ops.some(o => o.es_correcta);
      if (!hayCorrecta && ops.length > 0) ops[0].es_correcta = true;
      return { ...prev, opciones: ops };
    });
  };

  const handleGuardarPregunta = async (e) => {
    e.preventDefault();
    if (!formPregunta.texto.trim()) {
      Swal.fire('Error', 'El texto de la pregunta es requerido', 'error');
      return;
    }
    const opcionesValidas = formPregunta.opciones.filter(o => o.texto.trim());
    if (opcionesValidas.length < 2) {
      Swal.fire('Error', 'Debes completar al menos 2 opciones de respuesta', 'error');
      return;
    }

    try {
      setGuardandoPregunta(true);
      let res, data;

      const payload = {
        texto: formPregunta.texto.trim(),
        opciones: opcionesValidas,
      };

      if (editingPregunta) {
        res = await fetch(
          `${API_URL}/api/evaluaciones/${evaluacion.id}/preguntas/${editingPregunta.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(`${API_URL}/api/evaluaciones/${evaluacion.id}/preguntas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire('Guardado', editingPregunta ? 'Pregunta actualizada' : 'Pregunta agregada', 'success');
      cerrarFormPregunta();
      await cargarEvaluacion();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardandoPregunta(false);
    }
  };

  const handleEliminarPregunta = (pregunta) => {
    Swal.fire({
      title: '¿Eliminar pregunta?',
      text: `"${pregunta.texto}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(
          `${API_URL}/api/evaluaciones/${evaluacion.id}/preguntas/${pregunta.id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        await cargarEvaluacion();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="eval-manager-overlay">
        <div className="eval-manager-modal">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eval-manager-overlay">
      <div className="eval-manager-modal">

        {/* Header */}
        <div className="eval-manager-header">
          <div className="d-flex align-items-center gap-2">
            <ClipboardList size={20} />
            <h5 className="mb-0">Evaluación Final del Curso</h5>
          </div>
          <button className="btn-close-eval" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="eval-manager-body">

          {/* ── Sección: Datos de la evaluación ── */}
          <div className="eval-section">
            <h6 className="eval-section-title">Configuración de la evaluación</h6>
            <form onSubmit={handleGuardarEval} className="eval-form-base">
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label">Título de la evaluación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formEval.titulo}
                    onChange={e => setFormEval(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ej: Evaluación final — EPP"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Nota mínima para aprobar (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formEval.calificacion_minima}
                    onChange={e => setFormEval(p => ({ ...p, calificacion_minima: e.target.value }))}
                    min={1}
                    max={100}
                    required
                  />
                </div>
                <div className="btn-guardar-evaluacion">
                  <button type="submit" className="btn btn-primary w-100" disabled={guardandoEval}>
                    {guardandoEval ? '...' : evaluacion ? 'Actualizar' : 'Crear'}
                  </button>
                  {evaluacion && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleEliminarEval}
                      title="Eliminar evaluación"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Tipo de evaluación — solo al crear */}
                {!evaluacion && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Tipo de evaluación</label>
                    <div className="d-flex gap-3">
                      <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tipo_eval"
                          value="opcion_multiple"
                          checked={formEval.tipo === 'opcion_multiple'}
                          onChange={() => setFormEval(p => ({ ...p, tipo: 'opcion_multiple' }))}
                        />
                        <ClipboardList size={15} />
                        Opción múltiple
                      </label>
                      <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tipo_eval"
                          value="crucigrama"
                          checked={formEval.tipo === 'crucigrama'}
                          onChange={() => setFormEval(p => ({ ...p, tipo: 'crucigrama' }))}
                        />
                        <Grid3X3 size={15} />
                        Crucigrama
                      </label>
                    </div>
                    <small className="text-muted">
                      El tipo no se puede cambiar después de crear la evaluación.
                    </small>
                  </div>
                )}
              </div>
              <p className="eval-nota-info mt-2">
                El usuario necesita obtener al menos <strong>{formEval.calificacion_minima}%</strong> para aprobar.
                Tiene máximo <strong>2 intentos</strong>. Si falla ambos, Talento Humano puede rehabilitar.
              </p>
            </form>
          </div>

          {/* ── Sección: Crucigrama ── */}
          {evaluacion && evaluacion.tipo === 'crucigrama' && (
            <div className="eval-section">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Grid3X3 size={16} />
                <h6 className="eval-section-title mb-0">Diseño del crucigrama</h6>
              </div>
              <CrucigramaBuilder
                evaluacionId={evaluacion.id}
                pistasIniciales={pistasIniciales}
                onGuardado={cargarEvaluacion}
              />
            </div>
          )}

          {/* ── Sección: Preguntas (solo opción múltiple) ── */}
          {evaluacion && evaluacion.tipo !== 'crucigrama' && (
            <div className="eval-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="eval-section-title mb-0">
                  Preguntas ({preguntas.length})
                </h6>
                <button
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={() => abrirFormPregunta()}
                >
                  <Plus size={14} /> Agregar pregunta
                </button>
              </div>

              {preguntas.length === 0 ? (
                <div className="alert alert-warning text-center">
                  Aún no hay preguntas. Agrega al menos una para que la evaluación sea funcional.
                </div>
              ) : (
                <div className="preguntas-list">
                  {preguntas.map((preg, idx) => (
                    <div key={preg.id} className="pregunta-card">
                      <div className="pregunta-header">
                        <span className="pregunta-num">P{idx + 1}</span>
                        <p className="pregunta-texto">{preg.texto}</p>
                        <div className="pregunta-acciones">
                          <button
                            className="btn-icon btn-edit-p"
                            onClick={() => abrirFormPregunta(preg)}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-icon btn-delete-p"
                            onClick={() => handleEliminarPregunta(preg)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <ul className="opciones-list">
                        {preg.opciones.map((op) => (
                          <li key={op.id} className={`opcion-item ${op.es_correcta ? 'correcta' : ''}`}>
                            {op.es_correcta && <CheckCircle size={13} className="me-1" />}
                            {op.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Formulario de pregunta ── */}
      {showPreguntaForm && (
        <div className="eval-pregunta-overlay">
          <div className="eval-pregunta-modal">
            <div className="eval-pregunta-header">
              <h6 className="mb-0">
                {editingPregunta ? 'Editar pregunta' : 'Nueva pregunta'}
              </h6>
              <button className="btn-close-eval" onClick={cerrarFormPregunta}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleGuardarPregunta} className="eval-pregunta-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Texto de la pregunta</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formPregunta.texto}
                  onChange={e => setFormPregunta(p => ({ ...p, texto: e.target.value }))}
                  placeholder="Escribe la pregunta aquí..."
                  required
                />
              </div>

              <label className="form-label fw-semibold">
                Opciones de respuesta
                <span className="text-muted ms-2 fw-normal">(marca la correcta)</span>
              </label>

              <div className="opciones-form-list">
                {formPregunta.opciones.map((op, idx) => (
                  <div key={idx} className="opcion-form-row">
                    <input
                      type="radio"
                      name="correcta"
                      checked={op.es_correcta}
                      onChange={() => handleOpcionCorrecta(idx)}
                      title="Marcar como correcta"
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={op.texto}
                      onChange={e => handleOpcionTexto(idx, e.target.value)}
                      placeholder={`Opción ${idx + 1}`}
                    />
                    {formPregunta.opciones.length > 2 && (
                      <button
                        type="button"
                        className="btn-icon btn-delete-p"
                        onClick={() => eliminarOpcion(idx)}
                        title="Quitar opción"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {formPregunta.opciones.length < 6 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm mt-2"
                  onClick={agregarOpcion}
                >
                  <Plus size={13} className="me-1" /> Agregar opción
                </button>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={cerrarFormPregunta}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardandoPregunta}>
                  {guardandoPregunta ? 'Guardando...' : editingPregunta ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/resultadosEvaluaciones.css';

/**
 * ResultadosEvaluacionesProceso
 * Muestra los resultados de evaluaciones de todos los cursos del proceso
 * del admin que ha iniciado sesión. Permite rehabilitar usuarios bloqueados.
 *
 * Props:
 *   onClose — callback para volver al inicio
 */
export default function ResultadosEvaluacionesProceso() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [rehabilitando, setRehabilitando] = useState(null);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [anioReporte, setAnioReporte] = useState(new Date().getFullYear());
  const [reporteData, setReporteData] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('evaluaciones'); // 'evaluaciones' | 'reporte'
  const anioActual = new Date().getFullYear(); // todos | bloqueados | aprobados | reprobados

  useEffect(() => {
    cargarResultados();
    const intervalo = setInterval(cargarResultados, 30000);
    return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarResultados = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/evaluaciones/resultados/mis-cursos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResultados(data.data || []);
      } else {
        console.error('Error cargando resultados:', data.message);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarReporteAnio = async (anio) => {
    setCargandoReporte(true);
    try {
      const res = await fetch(`${API_URL}/api/version-cursos/reporte/anio/${anio}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setReporteData(data);
      else console.error('Error reporte:', data.message);
    } catch (err) {
      console.error('Error cargando reporte:', err);
    } finally {
      setCargandoReporte(false);
    }
  };

  const handleCambiarVista = (vista) => {
    setVistaActiva(vista);
    if (vista === 'reporte' && !reporteData) cargarReporteAnio(anioReporte);
  };

  const rehabilitar = async (evalId, usuarioId, usuarioNombre, cursoNombre) => {
    const confirm = await Swal.fire({
      title: '¿Rehabilitar evaluación?',
      html: `El usuario <strong>${usuarioNombre}</strong> podrá volver a intentar la evaluación del curso <strong>${cursoNombre}</strong> desde cero (0 intentos).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rehabilitar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    const key = `${evalId}_${usuarioId}`;
    setRehabilitando(key);
    try {
      const res = await fetch(
        `${API_URL}/api/evaluaciones/${evalId}/rehabilitar/${usuarioId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        Swal.fire('✅ Rehabilitado', data.message, 'success');
        cargarResultados();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setRehabilitando(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const str = typeof fechaStr === 'string' ? fechaStr : fechaStr.toString();
      if (str.includes('T') || str.includes(' ')) {
        const d = new Date(str);
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = (d.getMonth() + 1).toString().padStart(2, '0');
        const anio = d.getFullYear();
        const hora = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${dia}/${mes}/${anio} ${hora}:${min}`;
      }
      return str;
    } catch {
      return fechaStr;
    }
  };

  // ── Filtros ──────────────────────────────────────────────────
  // Por cada usuario+evaluación, quedarnos solo con el intento más reciente (por fecha)
  const estadoPorUsuarioEval = {};
  for (const r of resultados) {
    const key = `${r.usuario_id}_${r.evaluacion_id}`;
    if (
      !estadoPorUsuarioEval[key] ||
      new Date(r.fecha_intento) > new Date(estadoPorUsuarioEval[key].fecha_intento)
    ) {
      estadoPorUsuarioEval[key] = r;
    }
  }

  // Lista deduplicada (un registro por usuario+evaluación con el estado actual)
  const registrosActuales = Object.values(estadoPorUsuarioEval);

  const cursosUnicos = [...new Set(registrosActuales.map(r => r.curso_nombre))].sort();

  const registrosFiltrados = registrosActuales.filter(r => {
    const matchCurso = !filtroCurso || r.curso_nombre === filtroCurso;
    const matchEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'bloqueados' && r.bloqueado) ||
      (filtroEstado === 'aprobados' && r.aprobado) ||
      (filtroEstado === 'reprobados' && !r.aprobado && !r.bloqueado);
    return matchCurso && matchEstado;
  });

  const totalBloqueados = registrosActuales.filter(r => r.bloqueado).length;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="res-eval-container">

      {/* Header */}
      <div className="res-eval-header">
        {/*
        <button className="btn-back-eval" onClick={onClose}>
          <ArrowLeft size={16} />
          Volver
        </button>
        */}
        <div>
          <h4 className="mb-0"> Resultados de Evaluaciones</h4>
          <p className="mb-0 opacity-75 small">Resultados de los cursos de tu proceso</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${vistaActiva === 'evaluaciones' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleCambiarVista('evaluaciones')}
            >
              Evaluaciones
            </button>
            <button
              className={`btn ${vistaActiva === 'reporte' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleCambiarVista('reporte')}
            >
              Reporte por Año
            </button>
          </div>
          <button className="btn-refresh-eval" onClick={vistaActiva === 'reporte' ? () => cargarReporteAnio(anioReporte) : cargarResultados} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Resumen 
      {!cargando && registrosActuales.length > 0 && (
        <div className="res-eval-resumen">
          <div className="resumen-item total">
            <span className="num">{registrosActuales.length}</span>
            <span className="lbl">Total usuarios</span>
          </div>
          <div className="resumen-item aprobados">
            <span className="num">{registrosActuales.filter(r => r.aprobado).length}</span>
            <span className="lbl">Aprobados</span>
          </div>
          <div className="resumen-item reprobados">
            <span className="num">{registrosActuales.filter(r => !r.aprobado && !r.bloqueado).length}</span>
            <span className="lbl">Con intentos</span>
          </div>
          <div className="resumen-item bloqueados">
            <span className="num">{totalBloqueados}</span>
            <span className="lbl">Bloqueados</span>
          </div>
        </div>
      )} */}

      {vistaActiva === 'evaluaciones' && (<>
        {/* Alerta si hay bloqueados */}
      {!cargando && totalBloqueados > 0 && (
        <div className="res-eval-alerta-bloqueados">
          🔒 <strong>{totalBloqueados} usuario{totalBloqueados !== 1 ? 's' : ''}</strong> ha{totalBloqueados !== 1 ? 'n' : ''} agotado sus intentos.
          Usa el botón <strong>Rehabilitar</strong> para habilitarles un nuevo intento.
        </div>
      )}

      {/* Filtros */}
      {!cargando && registrosActuales.length > 0 && (
        <div className="res-eval-filtros">
          <select
            className="form-select form-select-sm"
            value={filtroCurso}
            onChange={e => setFiltroCurso(e.target.value)}
          >
            <option value="">Todos los cursos</option>
            {cursosUnicos.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="bloqueados">🔒 Bloqueados</option>
            <option value="aprobados">✅ Aprobados</option>
            <option value="reprobados">⏳ En curso (fallaron)</option>
          </select>
        </div>
      )}

      {/* Contenido */}
      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">Cargando resultados…</p>
        </div>
      )}

      {!cargando && registrosActuales.length === 0 && (
        <div className="alert alert-info text-center m-4">
          No hay intentos de evaluación registrados en los cursos de tu proceso.
        </div>
      )}

      {!cargando && registrosActuales.length > 0 && registrosFiltrados.length === 0 && (
        <div className="alert alert-warning text-center m-4">
          No hay resultados con ese filtro.
        </div>
      )}

      {!cargando && registrosFiltrados.length > 0 && (
        <div className="res-eval-tabla-wrapper">
          <table className="res-eval-tabla">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Cédula</th>
                <th>Curso</th>
                <th>Evaluación</th>
                <th>Nota mín.</th>
                <th>Último puntaje</th>
                <th>Intentos</th>
                <th>Fecha último</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => {
                const key = `${item.evaluacion_id}_${item.usuario_id}`;
                return (
                  <tr key={key} className={item.bloqueado ? 'fila-bloqueada' : ''}>
                    <td className="fw-semibold">{item.usuario_nombre}</td>
                    <td>{item.cedula_identidad || '—'}</td>
                    <td>{item.curso_nombre}</td>
                    <td>{item.evaluacion_titulo}</td>
                    <td className="text-center">{item.calificacion_minima}%</td>
                    <td className={`text-center fw-bold ${item.aprobado ? 'text-success' : 'text-danger'}`}>
                      {item.puntaje}%
                    </td>
                    <td className="text-center">
                      <span className={`badge-intentos intentos-${item.intentos_usados}`}>
                        {item.intentos_usados} / 2
                      </span>
                    </td>
                    <td>{formatearFecha(item.fecha_intento)}</td>
                    <td>
                      {item.aprobado ? (
                        <span className="badge bg-success">✅ Aprobado</span>
                      ) : item.bloqueado ? (
                        <span className="badge bg-danger">🔒 Bloqueado</span>
                      ) : (
                        <span className="badge bg-warning text-dark">En curso</span>
                      )}
                    </td>
                    <td>
                      {item.bloqueado && (
                        <button
                          className="btn-rehabilitar"
                          onClick={() => rehabilitar(item.evaluacion_id, item.usuario_id, item.usuario_nombre, item.curso_nombre)}
                          disabled={rehabilitando === key}
                          title="El usuario podrá volver a intentar la evaluación desde 0"
                        >
                          {rehabilitando === key ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <>
                              <RotateCcw size={13} />
                              Rehabilitar
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </>) /* fin vista evaluaciones */}

      {/* ── Vista: Reporte por año ──────────────────────────────── */}
      {vistaActiva === 'reporte' && (
        <div className="p-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <label className="fw-semibold mb-0">Año:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={anioReporte}
              onChange={e => {
                const a = parseInt(e.target.value);
                setAnioReporte(a);
                setReporteData(null);
                cargarReporteAnio(a);
              }}
            >
              {[anioActual - 2, anioActual - 1, anioActual, anioActual + 1].map(a => (
                <option key={a} value={a}>{a}{a === anioActual ? ' (actual)' : ''}</option>
              ))}
            </select>
          </div>

          {cargandoReporte && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          )}

          {!cargandoReporte && reporteData && reporteData.data.length === 0 && (
            <div className="alert alert-info">No hay cursos aprobados para el año {anioReporte}.</div>
          )}

          {!cargandoReporte && reporteData && reporteData.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle bg-white">
                <thead className="table-dark">
                  <tr>
                    <th>Curso</th>
                    <th>Proceso</th>
                    <th className="text-center">Inscritos</th>
                    <th className="text-center">Completaron</th>
                    <th className="text-center">Aprobaron eval.</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.data.map(c => (
                    <tr key={c.curso_id}>
                      <td><strong>{c.curso_nombre}</strong></td>
                      <td><span className="badge bg-secondary">{c.proceso}</span></td>
                      <td className="text-center">{c.total_inscritos}</td>
                      <td className="text-center">
                        {c.completados}
                        {c.total_inscritos > 0 && (
                          <small className="text-muted ms-1">
                            ({Math.round(c.completados / c.total_inscritos * 100)}%)
                          </small>
                        )}
                      </td>
                      <td className="text-center">
                        {c.aprobaron_evaluacion}
                        {c.total_inscritos > 0 && (
                          <small className="text-muted ms-1">
                            ({Math.round(c.aprobaron_evaluacion / c.total_inscritos * 100)}%)
                          </small>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${
                          c.activo ? 'bg-success' :
                          !c.habilitado_manual ? 'bg-secondary' : 'bg-primary'
                        }`}>
                          {c.activo ? 'Activo' : !c.habilitado_manual ? 'Deshabilitado' : 'Aprobado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

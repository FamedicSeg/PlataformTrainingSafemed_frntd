import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../styles/pages/panelControl.css';

export default function PanelControl() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cursoProgramando, setCursoProgramando] = useState(null);
  const [formProgramacion, setFormProgramacion] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [guardando, setGuardando] = useState(false);
  const [filtroProceso, setFiltroProceso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarPanel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPanel = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/cursos/panel-control`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCursos(data.data || []);
      } else {
        Swal.fire('Error', 'No se pudo cargar el panel de control', 'error');
      }
    } catch (error) {
      console.error('Error cargando panel:', error);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstado = (curso) => {
    const ahora = new Date();
    const inicio = curso.fecha_inicio ? new Date(curso.fecha_inicio) : null;
    const fin = curso.fecha_fin ? new Date(curso.fecha_fin) : null;

    if (!curso.habilitado_manual) return { texto: 'Deshabilitado', clase: 'bg-secondary' };
    if (inicio && ahora < inicio) return { texto: 'Programado', clase: 'bg-warning text-dark' };
    if (fin && ahora > fin) return { texto: 'Expirado', clase: 'bg-danger' };
    return { texto: 'Activo', clase: 'bg-success' };
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const d = new Date(fechaStr);
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const anio = d.getFullYear();
      const hora = d.getHours().toString().padStart(2, '0');
      const min = d.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes}/${anio} ${hora}:${min}`;
    } catch {
      return fechaStr;
    }
  };

  const toggleHabilitado = async (cursoId, estadoActual) => {
    const accion = estadoActual ? 'deshabilitar' : 'habilitar';
    const confirm = await Swal.fire({
      title: `¿${estadoActual ? 'Deshabilitar' : 'Habilitar'} curso?`,
      text: `El curso quedará ${estadoActual ? 'bloqueado para todos los usuarios' : 'accesible para los usuarios (según programación)'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: estadoActual ? '#dc3545' : '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/toggle-habilitado`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCursos(prev =>
          prev.map(c => c.id === cursoId ? { ...c, habilitado_manual: !c.habilitado_manual } : c)
        );
        Swal.fire({
          icon: 'success',
          title: estadoActual ? 'Curso deshabilitado' : 'Curso habilitado',
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Error', 'No se pudo cambiar el estado del curso', 'error');
      }
    } catch (error) {
      console.error('Error toggle:', error);
    }
  };

  const abrirProgramar = (curso) => {
    setCursoProgramando(curso);
    setFormProgramacion({
      fecha_inicio: curso.fecha_inicio ? new Date(curso.fecha_inicio).toISOString().slice(0, 16) : '',
      fecha_fin: curso.fecha_fin ? new Date(curso.fecha_fin).toISOString().slice(0, 16) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarProgramacion = async (overrideDates) => {
    const body = overrideDates !== undefined
      ? overrideDates
      : {
          fecha_inicio: formProgramacion.fecha_inicio || null,
          fecha_fin: formProgramacion.fecha_fin || null
        };

    if (body.fecha_inicio && body.fecha_fin && new Date(body.fecha_fin) <= new Date(body.fecha_inicio)) {
      Swal.fire('Error', 'La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoProgramando.id}/programar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setCursos(prev =>
          prev.map(c => c.id === cursoProgramando.id ? { ...c, ...data.data } : c)
        );
        setCursoProgramando(null);
        Swal.fire({ icon: 'success', title: 'Programación guardada', timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire('Error', data.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setGuardando(false);
    }
  };

  // Procesos únicos para el filtro
  const procesosUnicos = [...new Set(cursos.map(c => c.proceso_name))].sort();

  // Cursos filtrados
  const cursosFiltrados = cursos.filter(c => {
    const porProceso = !filtroProceso || c.proceso_name === filtroProceso;
    const estado = calcularEstado(c).texto;
    const porEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activo' && estado === 'Activo') ||
      (filtroEstado === 'deshabilitado' && estado === 'Deshabilitado') ||
      (filtroEstado === 'expirado' && estado === 'Expirado') ||
      (filtroEstado === 'programado' && estado === 'Programado');
    return porProceso && porEstado;
  });

  return (
    <div style={{ minHeight: '80vh' }}>

      {/* Header del panel */}
      <div className="d-flex justify-content-between align-items-center mb-4">        
        <div>
          {/*}
          <button className="btn btn-outline-secondary btn-sm me-3" onClick={onClose}>
            ← Volver al inicio
          </button>
          */}
        </div>
        <span className="titulo-panel">Panel de Control de Cursos</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargarPanel} disabled={cargando}>
          🔄 Actualizar
        </button>
      </div>

      {/* Formulario de programación */}
      {cursoProgramando && (
        <div className="card border-primary mb-4 shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              📅 Programar fechas: <strong>{cursoProgramando.nombre}</strong>
              <span className="ms-2 badge bg-light text-primary">{cursoProgramando.proceso_name}</span>
            </h6>
            <button className="btn btn-sm btn-light" onClick={() => setCursoProgramando(null)}>✕ Cancelar</button>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">📅 Fecha y Hora de Inicio:</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formProgramacion.fecha_inicio}
                  onChange={e => setFormProgramacion(p => ({ ...p, fecha_inicio: e.target.value }))}
                />
                <small className="text-muted">El curso se habilitará automáticamente en esta fecha/hora.</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">🔒 Fecha y Hora de Fin:</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formProgramacion.fecha_fin}
                  onChange={e => setFormProgramacion(p => ({ ...p, fecha_fin: e.target.value }))}
                />
                <small className="text-muted">El curso se bloqueará automáticamente en esta fecha/hora.</small>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-primary"
                onClick={() => guardarProgramacion()}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : '💾 Guardar Programación'}
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={() => guardarProgramacion({ fecha_inicio: null, fecha_fin: null })}
                disabled={guardando}
                title="Eliminar restricción de tiempo — el curso siempre estará disponible"
              >
                🗑️ Quitar Fechas
              </button>
              <button className="btn btn-secondary" onClick={() => setCursoProgramando(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {!cargando && cursos.length > 0 && (
        <div className="row mb-3 g-2">
          <div className="col-md-5">
            <select
              className="form-select form-select-sm"
              value={filtroProceso}
              onChange={e => setFiltroProceso(e.target.value)}
            >
              <option value="">Todos los procesos</option>
              {procesosUnicos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">✅ Activo</option>
              <option value="programado">🕐 Programado</option>
              <option value="expirado">❌ Expirado</option>
              <option value="deshabilitado">🔒 Deshabilitado</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <small className="text-muted">
              {cursosFiltrados.length} de {cursos.length} cursos
            </small>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Cargando cursos...</p>
        </div>
      )}

      {!cargando && cursos.length === 0 && (
        <div className="alert alert-info text-center">
          No hay cursos aprobados registrados aún.
        </div>
      )}

      {/* Tabla */}
      {!cargando && cursos.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle bg-white">
            <thead className="table-dark">
              <tr>
                <th className="col-curso-tabla">Curso</th>
                <th className="col-proceso-tabla">Proceso</th>
                <th className="col-fecha-inicio-tabla">Fecha Inicio</th>
                <th className="col-fecha-fin-tabla">Fecha Fin</th>
                <th className="col-estado-tabla text-center">Estado</th>
                <th className="col-acciones-tabla text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No hay cursos con ese filtro.
                  </td>
                </tr>
              ) : (
                cursosFiltrados.map(curso => {
                  const estado = calcularEstado(curso);
                  const esProgramando = cursoProgramando?.id === curso.id;
                  return (
                    <tr key={curso.id} style={esProgramando ? { background: '#e3f2fd' } : {}}>
                      <td>
                        <strong>{curso.nombre}</strong>
                        {esProgramando && <span className="ms-2 badge bg-primary">Editando...</span>}
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-75">{curso.proceso_name}</span>
                      </td>
                      <td className="text-nowrap">{formatearFecha(curso.fecha_inicio)}</td>
                      <td className="text-nowrap">{formatearFecha(curso.fecha_fin)}</td>
                      <td className="text-center">
                        <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                          <button
                            className={`btn btn-sm ${curso.habilitado_manual ? 'btn-deshabilitar' : 'btn-habilitar'}`}
                            onClick={() => toggleHabilitado(curso.id, curso.habilitado_manual)}
                            title={curso.habilitado_manual ? 'Deshabilitar curso' : 'Habilitar curso'}
                          >
                            {curso.habilitado_manual ? '🔒 Deshabilitar' : '✅ Habilitar'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => abrirProgramar(curso)}
                            title="Establecer fecha de inicio y fin"
                          >
                            📅 Programar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

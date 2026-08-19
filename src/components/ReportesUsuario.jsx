import { useState, useRef, useCallback } from 'react';
import {
  Search, User, BookOpen, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Award, Layers, Calendar
} from 'lucide-react';
import '../styles/components/reportesUsuario.css';

const ESTADO_CONFIG = {
  'completado':    { label: 'Curso Completado',   color: 'estado-completado',   icon: CheckCircle2 },
  'en progreso':   { label: 'Curso en Progreso',  color: 'estado-en-progreso',  icon: Clock },
  'no iniciado':   { label: 'Curso No Iniciado',  color: 'estado-no-iniciado',  icon: XCircle },
  'inscrito':      { label: 'Curso Inscrito',     color: 'estado-inscrito',     icon: BookOpen },
};

function estadoInfo(estado) {
  return ESTADO_CONFIG[estado] ?? { label: estado ?? 'Desconocido', color: 'estado-desconocido', icon: BookOpen };
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function PorcentajeBar({ valor }) {
  const pct = Math.min(100, Math.max(0, Number(valor) || 0));
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="ru-pct-bar-wrap">
      <div className="ru-pct-bar-bg">
        <div className="ru-pct-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ru-pct-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function ReportesUsuario() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [query, setQuery] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [errorCursos, setErrorCursos] = useState('');

  const [expandidos, setExpandidos] = useState({});

  const debounceRef = useRef(null);

  const buscarUsuarios = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setUsuarios([]);
      setErrorBusqueda('');
      return;
    }
    setBuscando(true);
    setErrorBusqueda('');
    try {
      const res = await fetch(
        `${API_URL}/api/usuarios/buscar-reporte?q=${encodeURIComponent(q.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setUsuarios(data.data || []);
        if (data.data?.length === 0) setErrorBusqueda('No se encontraron usuarios con ese nombre o cédula.');
      } else {
        setErrorBusqueda(data.message || 'Error al buscar usuarios.');
      }
    } catch {
      setErrorBusqueda('Error de conexión al buscar usuarios.');
    } finally {
      setBuscando(false);
    }
  }, [API_URL, token]);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setUsuarioSeleccionado(null);
    setCursos([]);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarUsuarios(v), 400);
  };

  const seleccionarUsuario = async (usuario) => {
    setUsuarioSeleccionado(usuario);
    setUsuarios([]);
    setQuery(usuario.nombre);
    setCargandoCursos(true);
    setErrorCursos('');
    setCursos([]);
    setExpandidos({});
    try {
      const res = await fetch(
        `${API_URL}/api/usuarios/${usuario.id}/reporte-cursos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCursos(data.data || []);
      } else {
        setErrorCursos(data.message || 'Error al obtener los cursos.');
      }
    } catch {
      setErrorCursos('Error de conexión al obtener los cursos.');
    } finally {
      setCargandoCursos(false);
    }
  };

  const limpiarBusqueda = () => {
    setQuery('');
    setUsuarios([]);
    setUsuarioSeleccionado(null);
    setCursos([]);
    setErrorBusqueda('');
    setErrorCursos('');
  };

  const toggleExpand = (procesoNombre) => {
    setExpandidos(prev => ({ ...prev, [procesoNombre]: !prev[procesoNombre] }));
  };

  // Agrupar cursos por proceso
  const cursosAgrupados = cursos.reduce((acc, curso) => {
    const p = curso.proceso || 'Sin proceso';
    if (!acc[p]) acc[p] = [];
    acc[p].push(curso);
    return acc;
  }, {});

  {/*
  const totalCursos = cursos.length;
  const completados = cursos.filter(c => c.estado === 'completado').length;
  const enProgreso = cursos.filter(c => c.estado === 'en_progreso').length;
  const noIniciados = cursos.filter(c => c.estado === 'no_iniciado' || c.estado === 'inscrito').length;
  */}

  return (
    <div className="ru-container">

      {/* ── Buscador ── */}
      <div className="ru-search-section">
        <div className="ru-search-label">
          <User size={16} />
          Buscar por nombre o cédula
        </div>
        <div className="ru-search-wrap">
          <Search size={16} className="ru-search-icon" />
          <input
            className="ru-search-input"
            type="text"
            placeholder="Escriba el nombre o cédula del colaborador..."
            value={query}
            onChange={handleQueryChange}
            autoComplete="off"
          />
          {query && (
            <button className="ru-search-clear" onClick={limpiarBusqueda} title="Limpiar">
              ×
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {usuarios.length > 0 && (
          <ul className="ru-dropdown">
            {usuarios.map(u => (
              <li key={u.id} className="ru-dropdown-item" onClick={() => seleccionarUsuario(u)}>
                <div className="ru-dropdown-avatar">{u.nombre?.[0]?.toUpperCase()}</div>
                <div className="ru-dropdown-info">
                  <span className="ru-dropdown-nombre">{u.nombre}</span>
                  <span className="ru-dropdown-meta">
                    {u.cedula_identidad && <span>CI: {u.cedula_identidad}</span>}
                    {u.proceso && <span> · Proceso: {u.proceso}</span>}
                    {u.cargo && <span> · Cargo: {u.cargo}</span>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {buscando && <p className="ru-search-hint">Buscando...</p>}
        {!buscando && errorBusqueda && query.length >= 2 && (
          <p className="ru-search-hint">{errorBusqueda}</p>
        )}
      </div>

      {/* ── Resultado: usuario seleccionado ── */}
      {usuarioSeleccionado && (
        <>
          {/* Tarjeta del usuario */}
          <div className="ru-user-card">
            <div className="ru-user-avatar-lg">{usuarioSeleccionado.nombre?.[0]?.toUpperCase()}</div>
            <div className="ru-user-details">
              <h3 className="ru-user-nombre">{usuarioSeleccionado.nombre}</h3>
              <div className="ru-user-meta">
                {usuarioSeleccionado.cedula_identidad && (
                  <span>CI: {usuarioSeleccionado.cedula_identidad}</span>
                )}
                {usuarioSeleccionado.proceso && <span> · Proceso: {usuarioSeleccionado.proceso}</span>}
                {usuarioSeleccionado.cargo && <span> · Cargo: {usuarioSeleccionado.cargo}</span>}
              </div>
            </div>
          </div>

          {/* Resumen estadístico 
          {!cargandoCursos && cursos.length > 0 && (
            <div className="ru-stats">
              <div className="ru-stat-card">
                <BookOpen size={20} className="ru-stat-icon all" />
                <div className="ru-stat-num">{totalCursos}</div>
                <div className="ru-stat-lbl">Total cursos</div>
              </div>
              <div className="ru-stat-card">
                <CheckCircle2 size={20} className="ru-stat-icon ok" />
                <div className="ru-stat-num">{completados}</div>
                <div className="ru-stat-lbl">Completados</div>
              </div>
              <div className="ru-stat-card">
                <Clock size={20} className="ru-stat-icon prog" />
                <div className="ru-stat-num">{enProgreso}</div>
                <div className="ru-stat-lbl">En progreso</div>
              </div>
              <div className="ru-stat-card">
                <XCircle size={20} className="ru-stat-icon pend" />
                <div className="ru-stat-num">{noIniciados}</div>
                <div className="ru-stat-lbl">No iniciados</div>
              </div>
            </div>
          )}
            */}

          {/* Cargando */}
          {cargandoCursos && (
            <div className="ru-loading">
              <div className="spinner-border text-primary" role="status" />
              <span>Cargando cursos...</span>
            </div>
          )}

          {/* Error */}
          {!cargandoCursos && errorCursos && (
            <div className="ru-error">{errorCursos}</div>
          )}

          {/* Sin cursos */}
          {!cargandoCursos && !errorCursos && cursos.length === 0 && (
            <div className="ru-empty">
              <BookOpen size={40} color="#94a3b8" />
              <p>Este colaborador no tiene cursos registrados.</p>
            </div>
          )}

          {/* Cursos agrupados por proceso */}
          {!cargandoCursos && !errorCursos && Object.keys(cursosAgrupados).map(procesoNombre => {
            const listaCursos = cursosAgrupados[procesoNombre];
            const estaExpandido = expandidos[procesoNombre] !== false; // expandido por defecto
            return (
              <div key={procesoNombre} className="ru-proceso-group">
                <button
                  className="ru-proceso-header"
                  onClick={() => toggleExpand(procesoNombre)}
                >
                  <span className="ru-proceso-nombre">
                    <Layers size={15} />
                    {procesoNombre}
                  </span>
                  <span className="ru-proceso-count">{listaCursos.length} curso{listaCursos.length !== 1 ? 's' : ''}</span>
                  {estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {estaExpandido && (
                  <div className="ru-cursos-list">
                    {listaCursos.map(curso => {
                      const ei = estadoInfo(curso.estado);
                      const IconEstado = ei.icon;
                      const totalMod = Number(curso.total_modulos) || 0;
                      const compMod = Number(curso.modulos_completados) || 0;
                      const pctMod = totalMod > 0 ? Math.round((compMod / totalMod) * 100) : 0;
                      const puntaje = curso.mejor_puntaje != null ? Number(curso.mejor_puntaje) : null;

                      return (
                        <div key={curso.id} className="ru-curso-row">
                          <div className="ru-curso-info">
                            <div className="ru-curso-nombre">{curso.curso_nombre}</div>
                            <div className="ru-curso-meta">
                              <Calendar size={12} />
                              Inscrito: {formatFecha(curso.fecha_inscripcion)}
                              {curso.fecha_fin && (
                                <> &nbsp;·&nbsp; Finalización del Curso: {formatFecha(curso.fecha_fin)}</>
                              )}
                            </div>
                          </div>

                          <div className="ru-curso-estado">
                            <span className={`ru-estado-badge ${ei.color}`}>
                              <IconEstado size={12} />
                              {ei.label}
                            </span>
                          </div>

                          <div className="ru-curso-modulos">
                            <div className="ru-modulos-label">
                              <Layers size={12} />
                              {compMod}/{totalMod} módulos
                            </div>
                            {totalMod > 0 && <PorcentajeBar valor={pctMod} />}
                          </div>

                          <div className="ru-curso-eval">
                            {puntaje != null ? (
                              <>
                                <div className={`ru-eval-badge ${curso.evaluacion_aprobada ? 'eval-aprobado' : 'eval-reprobado'}`}>
                                  <Award size={12} />
                                  {curso.evaluacion_aprobada ? 'Exámen Aprobado' : 'Exámen Reprobado'}
                                </div>
                                <div className="ru-eval-puntaje">{puntaje}%</div>
                              </>
                            ) : (
                              <span className="ru-eval-sin">Sin evaluación</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Estado inicial */}
      {!usuarioSeleccionado && !buscando && query.length < 2 && (
        <div className="ru-empty">
          <Search size={40} color="#94a3b8" />
          <p>Busque un colaborador para ver su historial de capacitaciones.</p>
        </div>
      )}
    </div>
  );
}

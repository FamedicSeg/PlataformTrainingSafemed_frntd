import { useEffect, useState, useRef } from 'react';
import { Search, Download, Filter, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/gerenciaReportes.css';

export default function GerenciaReportes() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [personas, setPersonas] = useState([]);
  const [personasFiltered, setPersonasFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    proceso: ''
  });
  const [procesosList, setProcesosList] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    cargarPersonas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [personas, filtros]);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/gerencia/personas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setPersonas(data.data || []);
        // Extraer procesos únicos
        const procesos = [...new Set(data.data?.map(p => p.proceso) || [])].sort();
        setProcesosList(procesos);
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (error) {
      console.error('Error cargando personas:', error);
      Swal.fire('Error', 'No se pudieron cargar los reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...personas];

    // Filtro de búsqueda
    if (filtros.busqueda.trim()) {
      const q = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.cedula_identidad.includes(q) ||
        (p.cargo && p.cargo.toLowerCase().includes(q))
      );
    }

    // Filtro de proceso
    if (filtros.proceso) {
      resultado = resultado.filter(p => p.proceso === filtros.proceso);
    }

    // Filtro de estado
    if (filtros.estado !== 'todos') {
      resultado = resultado.filter(p => {
        if (filtros.estado === 'completado') {
          return (p.cursos_completados || 0) > 0;
        } else if (filtros.estado === 'en_progreso') {
          return (p.cursos_en_progreso || 0) > 0 && (p.cursos_completados || 0) === 0;
        } else if (filtros.estado === 'sin_participar') {
          return (p.total_inscripciones || 0) === 0;
        }
        return true;
      });
    }

    setPersonasFiltered(resultado);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setFiltros(prev => ({
      ...prev,
      busqueda: valor
    }));

    // Debounce la búsqueda
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      aplicarFiltros();
    }, 300);
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: 'todos',
      proceso: ''
    });
  };

  const exportarCSV = () => {
    if (personasFiltered.length === 0) {
      Swal.fire('Aviso', 'No hay datos para exportar', 'info');
      return;
    }

    const headers = ['Nombre', 'Cédula', 'Proceso', 'Cargo', 'Total Inscritos', 'Completados', 'En Progreso', 'Promedio Avance'];
    const rows = personasFiltered.map(p => [
      p.nombre,
      p.cedula_identidad,
      p.proceso || '—',
      p.cargo || '—',
      p.total_inscripciones || 0,
      p.cursos_completados || 0,
      p.cursos_en_progreso || 0,
      `${p.promedio_avance || 0}%`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Gerencia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('Éxito', 'Reporte exportado correctamente', 'success');
  };

  const getEstadoInfo = (persona) => {
    if ((persona.total_inscripciones || 0) === 0) {
      return { texto: 'Sin participar', color: 'gr-sin-participar', icon: AlertCircle };
    } else if ((persona.cursos_completados || 0) > 0) {
      return { texto: 'Completado', color: 'gr-completado', icon: CheckCircle2 };
    } else if ((persona.cursos_en_progreso || 0) > 0) {
      return { texto: 'En Progreso', color: 'gr-progreso', icon: Clock };
    }
    return { texto: 'Inscrito', color: 'gr-inscrito', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="gr-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="gr-container">
      <h2 className="gr-title">Reporte de Participación por Persona</h2>

      {/* ═══════════════════════════════════ FILTROS ═══════════════════════════════════ */}
      <div className="gr-filtros-section">
        <div className="gr-filtros-header">
          <Filter size={20} />
          <span>Filtros</span>
        </div>

        <div className="gr-filtros-grid">
          {/* Búsqueda */}
          <div className="gr-filtro-item">
            <label>Buscar Persona</label>
            <div className="gr-search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Nombre, cédula o cargo..."
                name="busqueda"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
              />
              {filtros.busqueda && (
                <button className="gr-clear-btn" onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="gr-filtro-item">
            <label>Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="form-select"
            >
              <option value="todos">Todos</option>
              <option value="completado">Completados</option>
              <option value="en_progreso">En Progreso</option>
              <option value="sin_participar">Sin Participar</option>
            </select>
          </div>

          {/* Proceso */}
          <div className="gr-filtro-item">
            <label>Proceso</label>
            <select
              name="proceso"
              value={filtros.proceso}
              onChange={handleFiltroChange}
              className="form-select"
            >
              <option value="">Todos</option>
              {procesosList.map(proc => (
                <option key={proc} value={proc}>{proc || 'Sin Asignar'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="gr-filtros-acciones">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={limpiarFiltros}
            disabled={!filtros.busqueda && filtros.estado === 'todos' && !filtros.proceso}
          >
            Limpiar Filtros
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={exportarCSV}
          >
            <Download size={16} /> Descargar CSV
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════ TABLA ═══════════════════════════════════ */}
      <div className="gr-tabla-section">
        <div className="gr-tabla-header">
          <span>{personasFiltered.length} personas encontradas</span>
        </div>

        {personasFiltered.length > 0 ? (
          <div className="gr-tabla-wrapper">
            <table className="gr-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Proceso</th>
                  <th>Cargo</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Inscritos</th>
                  <th className="text-center">Completados</th>
                  <th className="text-center">En Progreso</th>
                  <th className="text-center">Avance %</th>
                </tr>
              </thead>
              <tbody>
                {personasFiltered.map((persona, idx) => {
                  const estadoInfo = getEstadoInfo(persona);
                  const IconoEstado = estadoInfo.icon;
                  return (
                    <tr key={idx}>
                      <td className="gr-nombre">{persona.nombre}</td>
                      <td>{persona.cedula_identidad}</td>
                      <td>{persona.proceso || '—'}</td>
                      <td>{persona.cargo || '—'}</td>
                      <td className="text-center">
                        <span className={`gr-badge gr-badge-${estadoInfo.color}`}>
                          <IconoEstado size={14} />
                          {estadoInfo.texto}
                        </span>
                      </td>
                      <td className="text-center">{persona.total_inscripciones || 0}</td>
                      <td className="text-center gr-completados">
                        <strong>{persona.cursos_completados || 0}</strong>
                      </td>
                      <td className="text-center gr-progreso">
                        <strong>{persona.cursos_en_progreso || 0}</strong>
                      </td>
                      <td className="text-center">
                        <div className="gr-progreso-bar">
                          <div
                            className="gr-progreso-fill"
                            style={{
                              width: `${Math.min(100, persona.promedio_avance || 0)}%`,
                              backgroundColor: persona.promedio_avance >= 70 ? '#22c55e' : persona.promedio_avance >= 40 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="gr-pct">{persona.promedio_avance || 0}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="gr-empty">
            <AlertCircle size={48} />
            <p>No hay personas que coincidan con los filtros aplicados</p>
            <button className="btn btn-sm btn-outline-primary" onClick={limpiarFiltros}>
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

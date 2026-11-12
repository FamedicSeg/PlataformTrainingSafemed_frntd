import { useState, useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Swal from 'sweetalert2';
import '../styles/components/cursoDetailPanel.css';

export default function CursoDetailPanel({ curso, proceso, isOpen, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    if (isOpen && curso) {
      cargarDetalles();
    }
  }, [isOpen, curso]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      const cursoId = curso.curso_id || curso.id;
      
      console.log('🔍 [CursoDetailPanel] Datos del curso recibidos:', curso);
      console.log('🔍 [CursoDetailPanel] curso_id a usar:', cursoId);
      
      if (!cursoId) {
        throw new Error('curso_id no definido en el objeto curso');
      }
      
      const res = await fetch(
        `${API_URL}/api/gerencia/curso-detalle?curso_id=${cursoId}&proceso_nombre=${proceso}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setDetalles(data.data);
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      Swal.fire('Error', 'No se pudieron cargar los detalles del curso', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stats = detalles?.estadisticas || {};
  const completos = Number(stats.completados || 0);
  const enProgreso = Number(stats.en_progreso || 0);
  const noIniciados = Number(stats.no_iniciados || 0);
  const totalPersonas = completos + enProgreso + noIniciados;

  const graficoData = detalles?.estadisticas
    ? [
        { 
          estado: 'Completados', 
          cantidad: completos,
          porcentaje: (completos / totalPersonas)*100,
          fill: '#10b981'
        },
        { 
          estado: 'En Progreso', 
          cantidad: enProgreso,
          porcentaje: (enProgreso / totalPersonas)*100,
          fill: '#f59e0b'
        },
        { 
          estado: 'No Iniciados', 
          cantidad: noIniciados,
          porcentaje: (noIniciados / totalPersonas)*100,
          fill: '#ef4444'
        }
      ]
    : []

  const personasFiltered = detalles?.personas || [];
  const personasConFiltro = personasFiltered.filter(p => {
    if (filtroEstado === 'todos') return true;
    return p.estado.toLowerCase() === filtroEstado.toLowerCase();
  });

  return (
    <div className="curso-detail-overlay" onClick={onClose}>
      <div className="curso-detail-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title">
            <h2>{curso?.curso_nombre || curso?.nombre || 'Curso'}</h2>
            <p className="text-muted">{proceso}</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="spinner"></div>
            <p>Cargando detalles...</p>
          </div>
        ) : detalles ? (
          <div className="panel-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{detalles.estadisticas?.inscritos || 0}</div>
                <div className="stat-label">Inscritos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#10b981' }}>
                  {detalles.estadisticas?.completados || 0}
                </div>
                <div className="stat-label">Completados</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {detalles.estadisticas?.en_progreso || 0}
                </div>
                <div className="stat-label">En Progreso</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ef4444' }}>
                  {detalles.estadisticas?.no_iniciados || 0}
                </div>
                <div className="stat-label">No Iniciados</div>
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="grafico-container">
              <h3>Distribución de Estados</h3>
              <div className="grafico-wrapper">
                {graficoData.some(d => d.cantidad > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graficoData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="estado" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#fff', border: '1px solid #e5e7eb' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            const data = payload[0].payload;
                            const porcentajeValue = data.porcentaje !== undefined ? data.porcentaje.toFixed(2) : '0';
                            return (
                              <div style={{ color: '#030303', fontWeight: 600 }}>
                                {data.cantidad} personas | {porcentajeValue}%
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                        {graficoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted">Sin datos disponibles</p>
                )}
              </div>
            </div>

            {/* Tabla de Personas */}
            <div className="personas-container">
              <div className="personas-header">
                <h3>Participantes</h3>
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  className="filtro-estado"
                >
                  <option value="todos">Todos</option>
                  <option value="completado">Completados</option>
                  <option value="en progreso">En Progreso</option>
                  <option value="no iniciado">No Iniciados</option>
                </select>
              </div>

              <div className="personas-table">
                {personasConFiltro.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personasConFiltro.map((persona, idx) => (
                        <tr key={idx}>
                          <td>{persona.nombre}</td>
                          <td className="text-muted">{persona.cargo}</td>
                          <td>
                            <span className={`badge badge-${persona.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                              {persona.estado}
                            </span>
                          </td>
                          <td>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${persona.progreso}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{persona.progreso}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-muted">No hay participantes con este filtro</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel-error">
            <p>No se pudieron cargar los detalles</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../styles/components/reporteAsistencia.css';

export default function ReporteAsistencia({ cursoId, nombreCurso }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [asistencia, setAsistencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAsistentes, setTotalAsistentes] = useState(0);
  const [token, setToken] = useState(null);

  useEffect(() => {
    cargarAsistencia();
  }, [cursoId]);

  const cargarAsistencia = async () => {
    try {
      const tokenFromStorage = localStorage.getItem('admin_token');
      if (!tokenFromStorage) {
        console.error('❌ Token de admin no encontrado');
        setLoading(false);
        return;
      }

      setToken(tokenFromStorage);
      setLoading(true);

      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/asistencia`, {
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error cargando asistencia');
      }

      const data = await res.json();
      
      if (data.success) {
        setAsistencia(data.data.asistentes || []);
        setTotalAsistentes(data.data.total_asistentes || 0);
        console.log('✅ Asistencia cargada:', data.data.asistentes);
      } else {
        throw new Error(data.message);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error cargando asistencia:', error);
      setLoading(false);
      Swal.fire('Error', error.message || 'No se pudo cargar el reporte de asistencia', 'error');
    }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return '---';
    return new Date(fecha).toLocaleString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatearDuracion = (minutos) => {
    if (!minutos) return '---';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const exportarCSV = () => {
    const headers = ['Nombre', 'Cédula', 'Cargo', 'Hora Entrada', 'Hora Salida', 'Duración'];
    const rows = asistencia.map(a => [
      a.usuario_nombre || '---',
      a.cedula_identidad || '---',
      a.cargo || '---',
      formatearHora(a.hora_entrada),
      formatearHora(a.hora_salida),
      formatearDuracion(a.duracion_minutos)
    ]);

    const csvContent = [
      [`Reporte de Asistencia - ${nombreCurso}`, ''],
      [`Generado: ${new Date().toLocaleString('es-EC')}`, ''],
      [`Total de Asistentes: ${totalAsistentes}`, ''],
      [],
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Asistencia_${nombreCurso}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    Swal.fire('Éxito', 'Reporte exportado correctamente', 'success');
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando reporte de asistencia...</p>
      </div>
    );
  }

  return (
    <div className="reporte-asistencia">
      <div className="reporte-header">
        <h3 className="titulo-reporte">
            Reporte de Asistencia: {nombreCurso}
        </h3>
        <p className="subtitulo-reporte">
          Total de Asistentes: <strong>{totalAsistentes}</strong>
        </p>
      </div>

      {asistencia.length === 0 ? (
        <div className="alert alert-info mt-4">
          <h5>No hay registros de asistencia</h5>
          <p className="mb-0">Los asistentes aparecerán aquí cuando se unan a la conferencia</p>
        </div>
      ) : (
        <>
          <div className="reporte-acciones">
            <button
              className="btn btn-export"
              onClick={exportarCSV}
              title="Descargar en formato CSV"
            >
              Exportar CSV
            </button>
            <button
              className="btn btn-refresh"
              onClick={cargarAsistencia}
              title="Actualizar reporte"
            >
              🔄 Actualizar
            </button>
          </div>

          <div className="tabla-responsiva">
            <table className="tabla-asistencia">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Cargo</th>
                  <th>Hora Entrada</th>
                  <th>Hora Salida</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {asistencia.map((asistente, idx) => (
                  <tr key={asistente.usuario_id} className={asistente.hora_salida ? 'asistente-completo' : 'asistente-activo'}>
                    <td className="num-fila">{idx + 1}</td>
                    <td className="nombre-cell">{asistente.usuario_nombre}</td>
                    <td className="cedula-cell">{asistente.cedula_identidad}</td>
                    <td className="cargo-cell">{asistente.cargo}</td>
                    <td className="hora-cell">
                      <span className="badge bg-success">
                        {formatearHora(asistente.hora_entrada)}
                      </span>
                    </td>
                    <td className="hora-cell">
                      {asistente.hora_salida ? (
                        <span className="badge bg-secondary">
                          {formatearHora(asistente.hora_salida)}
                        </span>
                      ) : (
                        <span className="badge bg-info">EN VIVO</span>
                      )}
                    </td>
                    <td className="duracion-cell">
                      <strong>{formatearDuracion(asistente.duracion_minutos)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de estadísticas 
          <div className="estadisticas-resumen mt-4">
            <div className="stat-card">
              <div className="stat-valor">{totalAsistentes}</div>
              <div className="stat-label">Asistentes Totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">
                {asistencia.filter(a => a.hora_salida).length}
              </div>
              <div className="stat-label">Completaron</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">
                {asistencia.filter(a => !a.hora_salida).length}
              </div>
              <div className="stat-label">En Vivo</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">
                {asistencia.length > 0
                  ? Math.round(
                      asistencia.reduce((sum, a) => sum + (a.duracion_minutos || 0), 0) /
                        asistencia.length
                    )
                  : 0}
              </div>
              <div className="stat-label">Duración Promedio (min)</div>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Award, Download, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { descargarCertificadoPdf } from '../utils/certificadoPdf';

const formatFecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
};

export default function CertificadosProcesoPanel() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState('');
  const [descargando, setDescargando] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/certificados/mi-proceso`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Error');
        setCertificados(data.data || []);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los certificados', 'error');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [API_URL, token]);

  const cursos = useMemo(
    () => [...new Set(certificados.map((c) => c.nombre_curso))].sort(),
    [certificados]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return certificados.filter((c) => {
      if (cursoFiltro && c.nombre_curso !== cursoFiltro) return false;
      if (!q) return true;
      return [c.nombre_usuario, c.cedula_identidad, c.codigo_certificado]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [certificados, busqueda, cursoFiltro]);

  const descargar = async (cert) => {
    setDescargando(cert.id);
    try {
      const res = await fetch(`${API_URL}/api/certificados/mi-proceso/${cert.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error');
      const c = data.data;

      await descargarCertificadoPdf({
        nombreUsuario: c.nombre_usuario,
        cedula: c.cedula_identidad,
        cargo: c.cargo,
        nombreCurso: c.nombre_curso,
        calificacion: c.calificacion,
        fecha: formatFecha(c.fecha_emision),
        firmas: (c.firmas || []).map((f) => ({
          nombre_admin: f.nombre_admin,
          cargo: f.cargo,
          imagen_firma_url: f.imagen_firma_url || '/img/firma.png',
        })),
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo generar el certificado', 'error');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <div className="input-group" style={{ maxWidth: 340 }}>
          <span className="input-group-text"><Search size={16} /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, cédula o código"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ maxWidth: 320 }}
          value={cursoFiltro}
          onChange={(e) => setCursoFiltro(e.target.value)}
        >
          <option value="">Todos los cursos</option>
          {cursos.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-muted ms-auto">
          <Award size={16} /> {filtrados.length} certificado{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="alert alert-info">No hay certificados emitidos.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Cédula</th>
                <th>Curso</th>
                <th>Calificación</th>
                <th>Emisión</th>
                <th>Código</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre_usuario}</td>
                  <td>{c.cedula_identidad}</td>
                  <td>{c.nombre_curso}</td>
                  <td>{c.calificacion != null ? `${Number(c.calificacion).toFixed(1)}%` : '—'}</td>
                  <td>{formatFecha(c.fecha_emision)}</td>
                  <td><small>{c.codigo_certificado}</small></td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={descargando === c.id}
                      onClick={() => descargar(c)}
                    >
                      <Download size={14} /> {descargando === c.id ? 'Generando...' : 'Descargar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

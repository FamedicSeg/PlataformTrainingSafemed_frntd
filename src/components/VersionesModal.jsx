import { useState, useEffect } from 'react';
import { GitBranch, Copy } from 'lucide-react';
import Swal from 'sweetalert2';

export default function VersionesModal({ curso, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');
  const anioActual = new Date().getFullYear();

  const [versiones, setVersiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clonando, setClonando] = useState(false);

  useEffect(() => { cargarVersiones(); }, []);

  const cargarVersiones = async () => {
    setCargando(true);
    try {
      const baseId = curso.curso_base_id || curso.id;
      const res = await fetch(`${API_URL}/api/version-cursos/${baseId}/versiones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) setVersiones(data.data || []);
    } catch (err) {
      console.error('Error cargando versiones:', err);
    } finally {
      setCargando(false);
    }
  };

  const clonar = async (anioDestino) => {
    const confirm = await Swal.fire({
      title: `¿Crear versión ${anioDestino}?`,
      html: `Se copiará <strong>${curso.nombre}</strong> con todos sus módulos y evaluaciones.<br/><small class="text-muted">La nueva versión quedará en estado borrador para que la edites.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Crear versión ${anioDestino}`,
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    // Clonar desde la versión más reciente disponible
    const cursoIdOrigen = versiones[0]?.id ?? curso.id;
    setClonando(true);
    try {
      const res = await fetch(`${API_URL}/api/version-cursos/${cursoIdOrigen}/clonar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anio_destino: anioDestino })
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: `Versión ${anioDestino} creada`,
          html: `Módulos copiados: <strong>${data.data.modulos_copiados}</strong><br/>Evaluaciones copiadas: <strong>${data.data.evaluaciones_copiadas}</strong>`,
          confirmButtonColor: '#0d6efd'
        });
        cargarVersiones();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setClonando(false);
    }
  };

  const aniosExistentes = new Set(versiones.map(v => v.anio));
  const proximoAnio = !aniosExistentes.has(anioActual + 1) ? anioActual + 1 : null;

  const estadoBadge = (v) => {
    if (v.estado === 'aprobado' && v.activo) return <span className="badge bg-success">Activo</span>;
    if (v.estado === 'aprobado')             return <span className="badge bg-primary">Aprobado</span>;
    if (v.estado === 'pendiente')            return <span className="badge bg-warning text-dark">Pendiente</span>;
    if (v.estado === 'borrador')             return <span className="badge bg-secondary">Borrador</span>;
    return <span className="badge bg-light text-dark">{v.estado}</span>;
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header" style={{ background: 'linear-gradient(135deg,#2f445d,#1a3a6b)', color: '#fff' }}>
            <div>
              <h5 className="modal-title mb-0">
                <GitBranch size={17} className="me-2" />
                Versiones — {curso.nombre}
              </h5>
              <small style={{ opacity: 0.72 }}>Historial de versiones anuales del curso</small>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-0">
            {cargando ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : versiones.length === 0 ? (
              <div className="alert alert-info m-3">No se encontraron versiones para este curso.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Año</th>
                      <th>Estado</th>
                      <th className="text-center">Módulos</th>
                      <th className="text-center">Inscritos</th>
                      <th className="text-center">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versiones.map(v => (
                      <tr key={v.id} style={v.anio === anioActual ? { background: '#f0f7ff' } : {}}>
                        <td>
                          <strong>{v.anio}</strong>
                          {v.anio === anioActual && (
                            <span className="ms-2 badge bg-info text-dark">Año actual</span>
                          )}
                        </td>
                        <td>{estadoBadge(v)}</td>
                        <td className="text-center">{v.total_modulos}</td>
                        <td className="text-center">{v.total_inscritos}</td>
                        <td className="text-center text-muted" style={{ fontSize: '0.8rem' }}>
                          {new Date(v.creado_en).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer d-flex justify-content-between">
            <div>
              {!cargando && proximoAnio && (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => clonar(proximoAnio)}
                  disabled={clonando}
                >
                  <Copy size={15} />
                  {clonando ? 'Creando...' : `Crear versión ${proximoAnio}`}
                </button>
              )}
              {!cargando && !proximoAnio && versiones.length > 0 && (
                <small className="text-success fw-semibold">✅ Ya existe versión {anioActual + 1}</small>
              )}
            </div>
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>

        </div>
      </div>
    </div>
  );
}

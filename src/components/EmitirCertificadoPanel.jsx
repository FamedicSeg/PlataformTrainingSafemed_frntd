import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import EmitirCertificadoFirmas from './EmitirCertificadoFirmas';
import '../styles/components/EmitirCertificadoPanel.css';

export default function EmitirCertificadoPanel() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  // Estados
  const [cursos, setCursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [datosCertificado, setDatosCertificado] = useState(null);

  // Cargar cursos
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/cursos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCursos(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      Swal.fire('Error', 'No se pudieron cargar los cursos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios cuando se selecciona un curso
  useEffect(() => {
    if (cursoSeleccionado) {
      cargarUsuariosDelCurso(cursoSeleccionado);
    }
  }, [cursoSeleccionado]);

  const cargarUsuariosDelCurso = async (idCurso) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/cursos/${idCurso}/usuarios-inscritos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Manejar emisión de certificado
  const handleEmitir = async () => {
    if (!cursoSeleccionado) {
      Swal.fire('Validación', 'Selecciona un curso', 'warning');
      return;
    }

    if (!usuarioSeleccionado) {
      Swal.fire('Validación', 'Selecciona un usuario', 'warning');
      return;
    }

    // Obtener datos del curso y usuario
    const curso = cursos.find(c => c.id === parseInt(cursoSeleccionado));
    const usuario = usuarios.find(u => u.id === parseInt(usuarioSeleccionado));

    if (!curso || !usuario) {
      Swal.fire('Error', 'No se encontraron los datos', 'error');
      return;
    }

    // Preparar datos para el modal
    setDatosCertificado({
      idCurso: curso.id,
      idProceso: curso.proceso_id,
      idUsuario: usuario.id,
      nombreUsuario: usuario.nombre,
      nombreCurso: curso.nombre
    });

    setMostrarModal(true);
  };

  // Manejar cierre del modal
  const handleCloseModal = (emitido) => {
    setMostrarModal(false);
    if (emitido) {
      // Limpiar selección y recargar
      setCursoSeleccionado('');
      setUsuarioSeleccionado('');
      setUsuarios([]);
      Swal.fire('¡Éxito!', 'Certificado emitido correctamente', 'success');
    }
  };

  return (
    <div className="emitir-certificado-panel">
      <div className="panel-header">
        <h2>📜 Emitir Certificados</h2>
        <p className="panel-description">Emite certificados manualmente y selecciona las firmas que incluirá</p>
      </div>

      <div className="panel-content">
        {/* Selección de Curso */}
        <div className="form-section">
          <label className="form-label">Curso *</label>
          <select
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            className="form-control"
            disabled={loading}
          >
            <option value="">-- Selecciona un curso --</option>
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre} {curso.habilitar_certificado ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Usuario */}
        {cursoSeleccionado && (
          <div className="form-section">
            <label className="form-label">Usuario *</label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="form-control"
              disabled={loading || usuarios.length === 0}
            >
              <option value="">-- Selecciona un usuario --</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} ({usuario.email})
                </option>
              ))}
            </select>
            {usuarios.length === 0 && !loading && (
              <p className="text-warning">No hay usuarios inscritos en este curso</p>
            )}
          </div>
        )}

        {/* Botón Emitir */}
        <div className="form-actions">
          <button
            onClick={handleEmitir}
            disabled={!cursoSeleccionado || !usuarioSeleccionado || loading}
            className="btn-emitir"
          >
            {loading ? 'Cargando...' : 'Emitir Certificado con Firmas'}
          </button>
        </div>
      </div>

      {/* Modal de Emisión */}
      {mostrarModal && datosCertificado && (
        <EmitirCertificadoFirmas
          idCurso={datosCertificado.idCurso}
          idProceso={datosCertificado.idProceso}
          idUsuario={datosCertificado.idUsuario}
          nombreUsuario={datosCertificado.nombreUsuario}
          nombreCurso={datosCertificado.nombreCurso}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

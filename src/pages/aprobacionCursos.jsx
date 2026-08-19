import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/pages/aprobacionCursos.css';

export default function AprobacionCursos() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");
  const adminUser = JSON.parse(localStorage.getItem("admin_proceso_user") || '{}');

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [_rechazoRazon, _setRechazoRazon] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Verificar autenticación y que sea TALENTO HUMANO
  useEffect(() => {
    if (!token || !adminUser.id) {
      navigate('/admin/login');
      return;
    }

    // Debug: mostrar qué proceso_name se tiene
    console.log('🔍 Proceso encontrado:', adminUser.proceso_name);
    console.log('📋 Comparación:', adminUser.proceso_name?.trim().toUpperCase(), '===', 'TALENTO HUMANO');

    // Comparación flexible (case-insensitive y sin espacios extras)
    const esAceptado = adminUser.proceso_name?.trim().toUpperCase() === 'TALENTO HUMANO';
    
    if (!esAceptado) {
      Swal.fire('Acceso Denegado', 'Solo TALENTO HUMANO puede acceder aquí', 'error');
      navigate('/admin/principal');
      return;
    }
  }, [token, adminUser, navigate]);

  // Cargar cursos pendientes
  useEffect(() => {
    const esAceptado = adminUser.proceso_name?.trim().toUpperCase() === 'TALENTO HUMANO';
    if (esAceptado) {
      cargarCursosPendientes();
    }
  }, []);

  const cargarCursosPendientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cursos/pendientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar cursos pendientes');
      }

      setCursos(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (cursoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Aprobar curso?',
        text: 'Esta acción aprobará el curso y aparecerá disponible para usuarios',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745'
      });

      if (!result.isConfirmed) return;

      setProcesando(true);

      const response = await fetch(`${API_URL}/api/cursos/${cursoId}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al aprobar el curso seleccionado');
      }

      Swal.fire('Éxito', 'Curso aprobado correctamente', 'success');
      setSelectedCurso(null);
      cargarCursosPendientes();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async (cursoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Rechazar curso?',
        input: 'textarea',
        inputLabel: 'Razón del rechazo',
        inputPlaceholder: 'Ingrese la razón por la cual rechaza este curso...',
        inputAttributes: {
          'aria-label': 'Razón del rechazo'
        },
        showCancelButton: true,
        confirmButtonText: 'Sí, rechazar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'Debe proporcionar una razón de rechazo'
          }
        }
      });

      if (!result.isConfirmed) return;

      setProcesando(true);
      const razonRechazo = result.value;

      const response = await fetch(`${API_URL}/api/cursos/${cursoId}/rechazar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ razon_rechazo: razonRechazo })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al rechazar el curso seleccionado');
      }

      Swal.fire('Éxito', 'Curso rechazado correctamente', 'success');
      setSelectedCurso(null);
      cargarCursosPendientes();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="aprobacion-cursos-container">
      <div className="aprobacion-header">
        {/*
        <button
          className="btn-volver3"
          onClick={() => navigate('/admin/principal')}
        >
          <ArrowLeft size={20} /> Volver
        </button>
        */}
        <h1>Aprobación de Cursos</h1>
        <div className="estado-resumen">
          <span className="badge bg-warning">
            <Clock size={16} /> {cursos.length} pendientes
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="alert alert-info">
          <h4>No hay cursos pendientes</h4>
          <p>Todos los cursos han sido revisados.</p>
        </div>
      ) : (
        <div className="row">
          {/* Panel de cursos pendientes */}
          <div className="col-md-6">
            <div className="lista-cursos">
              <h3>Aprobación de Cursos Pendientes</h3>
              <div className="cursos-scroll">
                {cursos.map((curso) => (
                  <div
                    key={curso.id}
                    className={`curso-item ${selectedCurso?.id === curso.id ? 'active' : ''}`}
                    onClick={() => setSelectedCurso(curso)}
                  >
                    <div className="curso-item-header">
                      <h5>{curso.nombre}</h5>
                      <span className="badge bg-warning text-dark">Pendiente</span>
                    </div>
                    <p className="curso-item-meta">
                      Creado por: <strong>{curso.creado_por_nombre}</strong>
                    </p>
                    <p className="curso-item-meta">
                      Proceso: <strong>{curso.proceso_name}</strong>
                    </p>
                    <small className="text-muted">
                      {new Date(curso.creado_en).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de detalles */}
          <div className="col-md-6">
            {selectedCurso ? (
              <div className="curso-detalle">
                <h3>{selectedCurso.nombre}</h3>

                <div className="detalle-section">
                  <h6>Proceso:</h6>
                  <p>{selectedCurso.proceso_name}</p>
                </div>

                <div className="detalle-section">
                  <h6>Creado por:</h6>
                  <p>{selectedCurso.creado_por_nombre}</p>
                </div>

                <div className="detalle-section">
                  <h6>Descripción:</h6>
                  <p>{selectedCurso.descripcion || 'Sin descripción'}</p>
                </div>

                <div className="detalle-section">
                  <h6>Dirigido a:</h6>
                  <p>{selectedCurso.dirigido_a || 'No especificado'}</p>
                </div>

                <div className="detalle-section detalle-razon">
                  <h6>Razón del Curso:</h6>
                  <div className="razon-box">
                    <p>{selectedCurso.razon_curso}</p>
                  </div>
                </div>

                <div className="detalle-section">
                  <h6>Fecha Creación:</h6>
                  <p>{new Date(selectedCurso.creado_en).toLocaleString()}</p>
                </div>

                <div className="acciones-aprobacion">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={() => handleAprobar(selectedCurso.id)}
                    disabled={procesando}
                  >
                    <CheckCircle size={20} /> Aprobar
                  </button>
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={() => handleRechazar(selectedCurso.id)}
                    disabled={procesando}
                  >
                    <XCircle size={20} /> Rechazar
                  </button>
                </div>
              </div>
            ) : (
              <div className="sin-seleccion">
                <p>Selecciona un curso para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

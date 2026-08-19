import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, DownloadCloud } from 'lucide-react';
import Swal from 'sweetalert2';

export default function VisorCurso({ onCourseComplete }) {
  const navigate = useNavigate();
  const { cursoId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("user_token");
  const usuario = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');

  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduloActual, setModuloActual] = useState(0);
  const [marcadosCompletar, setMarcadosCompletar] = useState(new Set());
  const [inscripcion, setInscripcion] = useState(null);
  const [curso, setCurso] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [cursoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const modulosRes = await fetch(`${API_URL}/api/modulos/curso/${cursoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const modulosData = await modulosRes.json();
      setModulos(modulosData.data || []);

      const cursosRes = await fetch(`${API_URL}/api/cursos/${cursoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cursosData = await cursosRes.json();
      setCurso(cursosData.data);

      if (usuario.id) {
        const inscripcionesRes = await fetch(
          `${API_URL}/api/inscripciones/usuario/${usuario.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const inscripcionesData = await inscripcionesRes.json();
        const miInscripcion = inscripcionesData.data?.find(i => i.curso_id === parseInt(cursoId));
        setInscripcion(miInscripcion);

        // Si el estado es 'no iniciado', cambiar a 'en progreso' para registrar inicio_en
        if (miInscripcion && miInscripcion.estado === 'no iniciado') {
          try {
            await fetch(`${API_URL}/api/inscripciones/${miInscripcion.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ estado: 'en progreso' })
            });
            miInscripcion.estado = 'en progreso';
          } catch (err) {
            console.error('Error al actualizar estado a en progreso:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar los módulos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarCompleto = () => {
    const nuevosMarcados = new Set(marcadosCompletar);
    if (nuevosMarcados.has(modulos[moduloActual].id)) {
      nuevosMarcados.delete(modulos[moduloActual].id);
    } else {
      nuevosMarcados.add(modulos[moduloActual].id);
    }
    setMarcadosCompletar(nuevosMarcados);
  };

  const handleSiguiente = () => {
    if (moduloActual < modulos.length - 1) {
      setModuloActual(moduloActual + 1);
    }
  };

  const handleAnterior = () => {
    if (moduloActual > 0) {
      setModuloActual(moduloActual - 1);
    }
  };

  const handleVolver = () => {
    const token = localStorage.getItem("user_token");
    const usuario = JSON.parse(localStorage.getItem("usuario_logueado") || '{}');
    
    if (!token || !usuario.id) {
      navigate('/');
      return;
    }
    
    console.log('🔍 ===== VOLVIENDO =====');
    console.log('📍 URL actual:', window.location.pathname);
    
    // Verificar si venimos de una página específica
    const referrer = document.referrer;
    console.log('🔗 Página anterior:', referrer);
    
    // Si venimos de una página de proceso (ej: /courses/tthh), volver allí
    if (referrer && referrer.includes('/courses/')) {
      try {
        const url = new URL(referrer);
        const path = url.pathname;
        console.log(`✅ Volviendo a: ${path}`);
        navigate(path);
        return;
      } catch (e) {
        console.log('⚠️ Error procesando referrer:', e);
      }
    }
    
    // Si no, ir a /cursos-disponibles
    console.log('✅ Volviendo a /cursos-disponibles');
    navigate('/cursos-disponibles');
  };

  const handleCompletarCurso = async () => {
    if (marcadosCompletar.size !== modulos.length) {
      Swal.fire(
        'Incompleto',
        `Debes marcar como completado todos los módulos. ${marcadosCompletar.size}/${modulos.length} completados.`,
        'warning'
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'Completado' })
      });

      if (!response.ok) throw new Error('Error al completar curso');

      Swal.fire(
        'Félicidades',
        '¡Curso completado! Puedes descargar tu certificado ahora.',
        'success'
      );

      if (onCourseComplete) {
        onCourseComplete();
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleDescargarCertificado = () => {
    Swal.fire({
      title: 'Descargando certificado...',
      text: 'Función disponible próximamente',
      icon: 'info'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const modulo = modulos[moduloActual];
  const progreso = (marcadosCompletar.size / modulos.length) * 100;
  const estaCompletado = inscripcion?.estado === 'Completado';

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-primary" onClick={handleVolver}>
          <ChevronLeft size={20} className="me-2" />
          Volver a Cursos
        </button>
        <h2 className="mb-0">📖 {curso?.nombre}</h2>
        <div style={{ width: '100px' }}></div>
      </div>

      {/* Barra de progreso */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold">Progreso del Curso</span>
            <span>{Math.round(progreso)}%</span>
          </div>
          <div className="progress" style={{ height: '25px' }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${progreso}%` }}
            >
              {estaCompletado ? '✅ Completado' : `${marcadosCompletar.size}/${modulos.length} módulos`}
            </div>
          </div>

          {estaCompletado && (
            <div className="alert alert-success mt-3 mb-0">
              <strong>✓ Curso completado</strong> - Puedes descargar tu certificado
            </div>
          )}
        </div>
      </div>

      {/* Contenido del módulo */}
      <div className="row g-4">
        <div className="col-lg-9">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <strong>Módulo {moduloActual + 1} de {modulos.length}:</strong> {modulo?.titulo}
              </h5>
              <span className="badge bg-primary">
                {modulo?.tipo === 'texto' ? '📝' : modulo?.tipo === 'video' ? '🎬' : modulo?.tipo === 'imagen' ? '🖼️' : '📄'} {modulo?.tipo}
              </span>
            </div>

            <div className="card-body" style={{ minHeight: '400px' }}>
              {modulo?.tipo === 'video' && (
                <div className="embed-responsive" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                    src={modulo.url}
                    allowFullScreen
                    title={modulo.titulo}
                  ></iframe>
                </div>
              )}

              {modulo?.tipo === 'imagen' && (
                <div className="text-center">
                  <img
                    src={modulo.url}
                    alt={modulo.titulo}
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>
              )}

              {modulo?.tipo === 'pdf' && (
                <div className="text-center">
                  <div className="mb-3" style={{ fontSize: '48px' }}>📄</div>
                  <p className="text-muted">Documento PDF disponible</p>
                  <a href={modulo.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <DownloadCloud size={18} className="me-2" />
                    Abrir PDF
                  </a>
                </div>
              )}

              {modulo?.tipo === 'texto' && (
                <div className="bg-light p-4 rounded">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {modulo.contenido}
                  </div>
                </div>
              )}
            </div>

            <div className="card-footer d-flex justify-content-between align-items-center">
              <button
                className="btn btn-outline-secondary"
                onClick={handleAnterior}
                disabled={moduloActual === 0}
              >
                <ChevronLeft size={18} className="me-1" />
                Anterior
              </button>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`checkModulo${moduloActual}`}
                  checked={marcadosCompletar.has(modulo?.id)}
                  onChange={handleMarcarCompleto}
                  disabled={estaCompletado}
                />
                <label className="form-check-label" htmlFor={`checkModulo${moduloActual}`}>
                  Marcar como completado
                </label>
              </div>

              <button
                className="btn btn-outline-secondary"
                onClick={handleSiguiente}
                disabled={moduloActual === modulos.length - 1}
              >
                Siguiente
                <ChevronRight size={18} className="ms-1" />
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">📚 Módulos ({modulos.length})</h6>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {modulos.map((m, index) => (
                <button
                  key={m.id}
                  className={`list-group-item list-group-item-action text-start ${
                    moduloActual === index ? 'active' : ''
                  }`}
                  onClick={() => setModuloActual(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>Módulo {index + 1}</strong>
                      <p className="mb-0 small mt-1">{m.titulo}</p>
                    </div>
                    {marcadosCompletar.has(m.id) && (
                      <span className="badge bg-success rounded-pill">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="card-body border-top">
              {estaCompletado ? (
                <button
                  className="btn btn-success btn-sm w-100 mb-2"
                  onClick={handleDescargarCertificado}
                >
                  <Download size={16} className="me-1" />
                  Descargar Certificado
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm w-100"
                  onClick={handleCompletarCurso}
                  disabled={marcadosCompletar.size !== modulos.length}
                >
                  ✅ Completar Curso
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
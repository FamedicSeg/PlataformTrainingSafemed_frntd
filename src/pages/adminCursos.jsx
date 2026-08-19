import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import CursoForm from '../components/CursoForm';
import CursosTable from '../components/CursosTable';
import ModulosManager from '../components/ModulosManager';
import InscripcionesManager from '../components/InscripcionesManager';
import AsignarUsuariosModal from '../components/AsignarUsuariosModal';
import EvaluacionManager from '../components/EvaluacionManager';
import VersionesModal from '../components/VersionesModal';
import '../styles/pages/adminCursos.css';

export default function AdminCursos() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");
  const adminUser = JSON.parse(localStorage.getItem("admin_proceso_user") || '{}');

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [modulosModalCurso, setModulosModalCurso] = useState(null);
  const [inscripcionesModalCurso, setInscripcionesModalCurso] = useState(null);
  const [asignarUsuariosCurso, setAsignarUsuariosCurso] = useState(null);
  const [evaluacionModalCurso, setEvaluacionModalCurso] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [versionesModalCurso, setVersionesModalCurso] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState('');
  const anioActual = new Date().getFullYear();
  const aniosSelector = [anioActual - 1, anioActual, anioActual + 1];

  // Verificar autenticación
  useEffect(() => {
    if (!token || !adminUser.id) {
      navigate('/admin/login');
    }
  }, [token, adminUser, navigate]);

  // Cargar cursos
  useEffect(() => {
    cargarCursos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroAnio]);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      const url = filtroAnio
        ? `${API_URL}/api/cursos?anio=${filtroAnio}`
        : `${API_URL}/api/cursos`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar cursos');
      }

      setCursos(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingCurso(null);
    setShowForm(true);
  };

  const handleEditClick = (curso) => {
    setEditingCurso(curso);
    setShowForm(true);
  };

  const handleDeleteClick = async (cursoId) => {
    try {
      const response = await fetch(`${API_URL}/api/cursos/${cursoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire('Éxito', 'Curso eliminado correctamente', 'success');
      cargarCursos();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleSaveCurso = (nuevosCursos) => {
    setShowForm(false);
    setEditingCurso(null);
    cargarCursos();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCurso(null);
  };

  // Filtrar cursos
  const cursosFiltrados = cursos.filter(curso =>
    curso.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="header-info">
          <h1 className="h3 mb-1">GESTIÓN DE CURSOS</h1>
          <p className="text-muted mb-0">
            Proceso: <strong>{adminUser.proceso_name}</strong>
          </p>
        </div>
        {/*
        <button
          className="btn-return"
          onClick={() => navigate('/admin/home')}
        >
          <ArrowLeft size={14} className="me-2" />
          Volver
        </button>
        */}
      </div>

      {/* Contenido principal */}
      {showForm ? (
        // Mostrar formulario
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              {editingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </h5>
          </div>
          <div className="card-body">
            <CursoForm
              cursoId={editingCurso?.id}
              initialData={editingCurso}
              onSave={handleSaveCurso}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      ) : (
        // Mostrar tabla de cursos
        <>
          <div className="card mb-3">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col">
                  <div className="input-group">
                    <span className="input-group-text">🔍</span>
                    <input
                      type="text"
                      className="label-search"
                      placeholder="Buscar curso por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-auto">
                  <select
                    className="form-select form-select-sm"
                    value={filtroAnio}
                    onChange={e => setFiltroAnio(e.target.value)}
                    style={{ minWidth: 130 }}
                  >
                    <option value="">Todos los años</option>
                    {aniosSelector.map(a => (
                      <option key={a} value={a}>{a}{a === anioActual ? ' (actual)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="col-auto">
                  <button
                    className="btn-new-course"
                    onClick={handleCreateClick}
                  >
                    <Plus size={14} className="me-2" />
                    Agregar Nuevo Curso
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Mis Cursos ({cursosFiltrados.length})
              </h5>
            </div>
            <div className="card-body">
              <CursosTable
                cursos={cursosFiltrados}
                loading={loading}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onViewModulos={setModulosModalCurso}
                onViewInscripciones={setInscripcionesModalCurso}                
                onAssignUsers={setAsignarUsuariosCurso}
                onViewEvaluacion={setEvaluacionModalCurso}
                onViewVersiones={setVersionesModalCurso}
                />
            </div>
          </div>
        </>
      )}

      {/* Modal de Módulos */}
      {modulosModalCurso && (
        <ModulosManager
          cursoId={modulosModalCurso}
          onClose={() => setModulosModalCurso(null)}
        />
      )}

      {/* Modal de Inscripciones */}
      {inscripcionesModalCurso && (
        <InscripcionesManager
          cursoId={inscripcionesModalCurso}
          onClose={() => setInscripcionesModalCurso(null)}
        />
      )}

      {/* Modal de Asignar Usuarios */}
      {asignarUsuariosCurso && (
        <AsignarUsuariosModal
          cursoId={asignarUsuariosCurso}
          onClose={() => setAsignarUsuariosCurso(null)}
          onAssign={() => cargarCursos()}
        />
      )}

      {/* Modal de Evaluación Final */}
      {evaluacionModalCurso && (
        <EvaluacionManager
          cursoId={evaluacionModalCurso}
          onClose={() => setEvaluacionModalCurso(null)}
        />
      )}

      {/* Modal de Versiones anuales */}
      {versionesModalCurso && (
        <VersionesModal
          curso={versionesModalCurso}
          onClose={() => { setVersionesModalCurso(null); cargarCursos(); }}
        />
      )}
    </div>
  );
}

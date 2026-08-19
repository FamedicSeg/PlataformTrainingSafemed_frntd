import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import swal from 'sweetalert2';
import CursoForm from '../cursos/CursoForm';
import CursosTable from '../cursos/CursosTable';
import ModulosManager from '../cursos/ModulosManager';
import InscripcionesManager from '../cursos/InscripcionesManager';
import AsignarUsuarioModla from '../cursos/AsignarUsuarioModal';
import '../styles/pages/adminCursos.css';

export default function AdminCursos(){
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
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if(!token || !adminUser.id) {
            navigate('/admin/login');
        }
    }, [navigate, token, adminUser]);

    useEffect(() => {
        cargarCursos();
    }, []);

    const cargarCursos = async () => {
        try{
            setLoading(true);
            const res = await fetch(`${API_URL}/api/cursos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if(!res.ok){
                throw new Error(data.message || 'Error al cargar cursos');
            }
            setCursos(data.data || []);
        } catch (error) {
            console.error("Error al cargar cursos:", error);
            swal.fire('Error', error.message || 'Error al cargar cursos', 'error');
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

      swal.fire('Éxito', 'Curso eliminado correctamente', 'success');
      cargarCursos();
    } catch (error) {
      console.error('Error:', error);
      swal.fire('Error', error.message, 'error');
    }
  };

  const handleSaveCurso = (nuevosCurso) => {
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
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft size={18} className="me-2" />
          Volver al Dashboard
        </button>
      </div>

      {/* Contenido principal */}
      {showForm ? (
        // Mostrar formulario
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              {editingCurso ? '✏️ Editar Curso' : '➕ Crear Nuevo Curso'}
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
                      className="form-control"
                      placeholder="Buscar curso por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-auto">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateClick}
                  >
                    <Plus size={18} className="me-2" />
                    Nuevo Curso
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
                onViewInscripciones={setInscripcionesModalCurso}                onAssignUsers={setAsignarUsuariosCurso}              />
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
    </div>
  );
}


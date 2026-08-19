import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Settings, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminProcesoHome() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("admin_proceso_user");
    if (!userData) {
      navigate('/admin/procesos');
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      setAdminUser(user);
    } catch (error) {
      console.error('Error parsing user:', error);
      navigate('/admin/procesos');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se cerrará tu sesión de administrador',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_proceso_user');
        navigate('/admin/procesos');
      }
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-primary text-white py-5">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">👋 Bienvenido, {adminUser?.username}</h1>
              <p className="mb-0">
                Administrador del Proceso: <strong>{adminUser?.proceso_name}</strong>
              </p>
            </div>
            <button
              className="btn btn-danger"
              onClick={handleLogout}
            >
              <LogOut size={18} className="me-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container-fluid py-5">
        <div className="row g-4">
          {/* Tarjeta: Gestionar Cursos */}
          <div className="col-md-6 col-lg-4">
            <div
              className="card h-100 cursor-pointer shadow-sm hover:shadow-lg"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 1rem rgba(0,0,0,0.1)';
              }}
              onClick={() => navigate('/admin/cursos')}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📚</div>
                <h5 className="card-title fw-bold">Gestionar Cursos</h5>
                <p className="card-text text-muted">
                  Crear, editar y eliminar cursos de tu proceso
                </p>
              </div>
              <div className="card-footer bg-light border-0 text-center">
                <small className="text-primary fw-semibold">
                  Inicia aquí ➜
                </small>
              </div>
            </div>
          </div>

          {/* Tarjeta: Gestionar Inscripciones */}
          <div className="col-md-6 col-lg-4">
            <div
              className="card h-100 cursor-pointer shadow-sm"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: 0.6,
                pointerEvents: 'none'
              }}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>👥</div>
                <h5 className="card-title fw-bold">Inscripciones</h5>
                <p className="card-text text-muted">
                  Ver y gestionar inscripciones de estudiantes
                </p>
              </div>
              <div className="card-footer bg-light border-0 text-center">
                <small className="text-muted">
                  Disponible desde Gestionar Cursos
                </small>
              </div>
            </div>
          </div>

          {/* Tarjeta: Reportes */}
          <div className="col-md-6 col-lg-4">
            <div
              className="card h-100 cursor-pointer shadow-sm"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: 0.6,
                pointerEvents: 'none'
              }}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📊</div>
                <h5 className="card-title fw-bold">Reportes</h5>
                <p className="card-text text-muted">
                  Ver estadísticas y reportes de tu proceso
                </p>
              </div>
              <div className="card-footer bg-light border-0 text-center">
                <small className="text-muted">
                  Próximamente
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <div className="alert alert-info">
              <h6 className="alert-heading">ℹ️ Información Importante</h6>
              <ul className="mb-0">
                <li>Desde aquí puedes gestionar todos los cursos de tu proceso</li>
                <li>Para cada curso, puedes agregar módulos (videos, PDFs, textos)</li>
                <li>Puedes ver quién está inscrito y actualizar su estado</li>
                <li>Los usuarios verán los cursos activos en el catálogo</li>
                <li>Cuando completen un curso, pueden descargar su certificado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

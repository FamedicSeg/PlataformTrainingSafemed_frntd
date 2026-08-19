import { Trash2, Edit, Plus, Eye, Users } from 'lucide-react';
import Swal from 'sweetalert2';

/**
 * CursosTable - Tabla de cursos dinámicos
 * 
 * Props:
 *   - cursos: Array de cursos
 *   - loading: boolean
 *   - onEdit: callback para editar
 *   - onDelete: callback para eliminar
 *   - onViewModulos: callback para ver módulos
 *   - onViewInscripciones: callback para ver inscritos
 *   - onAssignUsers: callback para asignar usuarios
 */
export default function CursosTable({ 
  cursos = [], 
  loading = false,
  onEdit,
  onDelete,
  onViewModulos,
  onViewInscripciones,
  onAssignUsers
}) {

  const handleDeleteClick = (curso) => {
    Swal.fire({
      title: '¿Eliminar curso?',
      text: `Se eliminará "${curso.nombre}" y todo su contenido (módulos, evaluaciones, inscripciones)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete?.(curso.id);
      }
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando cursos...</span>
        </div>
      </div>
    );
  }

  if (cursos.length === 0) {
    return (
      <div className="alert alert-info text-center">
        <p className="mb-0">No hay cursos. <strong>Crea uno para comenzar</strong></p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Módulos</th>
            <th>Inscritos</th>
            <th>Estado</th>
            <th>Asignar</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map(curso => (
            <tr key={curso.id}>
              <td>
                <div>
                  <h6 className="mb-0 fw-semibold">{curso.nombre}</h6>
                  <small className="text-muted">
                    Creado: {new Date(curso.creado_en).toLocaleDateString('es-ES')}
                  </small>
                </div>
              </td>
              <td>
                <small>{curso.descripcion || 'Sin descripción'}</small>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => onViewModulos?.(curso.id)}
                  title="Ver módulos"
                >
                  <Plus size={16} className="me-1" />
                  Módulos
                </button>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => onViewInscripciones?.(curso.id)}
                  title="Ver inscritos"
                >
                  <Eye size={16} className="me-1" />
                  Ver
                </button>
              </td>
              <td>
                <span className={`badge ${curso.activo ? 'bg-success' : 'bg-danger'}`}>
                  {curso.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => onAssignUsers?.(curso.id)}
                  title="Asignar usuarios"
                >
                  <Users size={16} className="me-1" />
                  Asignar
                </button>
              </td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-warning me-1"
                  onClick={() => onEdit?.(curso)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteClick(curso)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

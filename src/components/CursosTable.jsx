import { Trash2, Edit, Plus, Eye, Users, ClipboardList, GitBranch } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/pages/cursoTable.css';
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
 *   - onViewEvaluacion: callback para gestionar evaluación
 */
export default function CursosTable({ 
  cursos = [], 
  loading = false,
  onEdit,
  onDelete,
  onViewModulos,
  onViewInscripciones,
  onAssignUsers,
  onViewEvaluacion,
  onViewVersiones
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
    // En tu componente CoursesSegInd.jsx
<div className="table-responsive">
    <table className="table-corporate">
        <thead>
            <tr>
                <th className="col-nom">Nombre</th>
                <th className="col-desc">Descripción</th>
                <th className="col-mod">Módulos</th>
                <th className="col-ins">Inscritos</th>
                <th className="col-eval">Evaluación</th>
                <th className="col-estado">Estado</th>
                <th className="col-asignar">Asignar</th>
                <th>Versiones</th>
                <th className="col-acciones text-end">Acciones</th>
            </tr>
        </thead>
        <tbody>
            {cursos.map(curso => (
                <tr key={curso.id}>
                    <td>
                        <div>
                            <div className="nombre-curso">{curso.nombre}</div>
                            <span className="fecha-creacion">
                                Creado: {new Date(curso.creado_en).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                    </td>
                    <td>
                        <div className="descripcion-curso">
                            {curso.descripcion || 'Sin descripción'}
                        </div>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-modulos"
                            onClick={() => onViewModulos?.(curso.id)}
                        >
                            <Plus size={14} />
                            <span>Módulos</span>
                        </button>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-inscritos"
                            onClick={() => onViewInscripciones?.(curso.id)}
                        >
                            <Eye size={14} />
                            <span>Ver</span>
                        </button>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-evaluacion"
                            onClick={() => onViewEvaluacion?.(curso.id)}
                            title="Gestionar evaluación final"
                        >
                            <ClipboardList size={14} />
                            <span>Evaluación</span>
                        </button>
                    </td>
                    <td>
                        <span className={`badge-estado ${curso.activo ? 'activo' : 'inactivo'}`}>
                            <span className="dot"></span>
                            {curso.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-asignar"
                            onClick={() => onAssignUsers?.(curso.id)}
                        >
                            <Users size={14} />
                            <span>Asignar</span>
                        </button>
                    </td>
                    <td>
                        <button
                            className="btn-accion"
                            style={{ background: '#e8f4f8', color: '#0d6efd', border: '1px solid #b6d4fe' }}
                            onClick={() => onViewVersiones?.(curso)}
                            title={`Versiones anuales — año ${curso.anio ?? '?'}`}
                        >
                            <GitBranch size={14} />
                            <span>{curso.anio ?? '—'}</span>
                        </button>
                    </td>
                    <td className="text-end">
                        <button
                            className="btn-accion btn-editar me-1"
                            onClick={() => onEdit?.(curso)}
                        >
                            <Edit size={14} />
                        </button>
                        <button
                            className="btn-accion btn-eliminar"
                            onClick={() => handleDeleteClick(curso)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
  );
}

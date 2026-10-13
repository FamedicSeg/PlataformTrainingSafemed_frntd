import { Trash2, Edit, Plus, Eye, Users, ClipboardList, GitBranch, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/pages/cursoTable.css';

export default function CursosTable({ 
  cursos = [], 
  loading = false,
  onEdit,
  //onDelete,
  onViewModulos,
  onViewInscripciones,
  onAssignUsers,
  onViewEvaluacion,
  onViewVersiones,
}) {


    {/*
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
  */}

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
                <th className="col-asignar">Asignar</th>
                <th className="col-eval">Evaluación</th>
                <th className="col-estado">Estado</th>
                <th className="col-ins">Inscritos</th>
                <th className="col-version">Año</th>
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
                            disabled={curso.estado !== 'aprobado'}
                            title={curso.estado !== 'aprobado' ? 'El curso debe estar aprobado para crear módulos' : ''}
                        >
                            <Plus size={14} />
                            <span>Módulos</span>
                        </button>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-asignar"
                            onClick={() => onAssignUsers?.(curso.id)}
                            disabled={curso.estado !== 'aprobado'}
                            title={curso.estado !== 'aprobado' ? 'El curso debe estar aprobado para asignar usuarios' : ''}
                        >
                            <Users size={14} />
                            <span>Asignar</span>
                        </button>
                    </td>
                    
                    <td>
                        <button
                            className="btn-accion btn-evaluacion"
                            onClick={() => onViewEvaluacion?.(curso.id)}
                            disabled={curso.estado !== 'aprobado'}
                            title={curso.estado !== 'aprobado' ? 'El curso debe estar aprobado para crear evaluaciones' : 'Gestionar evaluación final'}
                        >
                            <ClipboardList size={14} />
                            <span>Evaluación</span>
                        </button>
                    </td>
                    <td>
                        <div>
                            <span className={`badge-estado ${
                              curso.estado === 'aprobado' ? 'aprobado' :
                              curso.estado === 'rechazado' ? 'rechazado' :
                              'pendiente'
                            }`} >
                              <span className="dot" style={{backgroundColor: curso.estado === 'aprobado' ? 'green' : curso.estado === 'rechazado' ? '#6c0202' : 'gray', alignItems: 'center'}} ></span>
                              {curso.estado === 'aprobado' ? 'Aprobado' :
                               curso.estado === 'rechazado' ? 'Rechazado' :
                               'Pendiente'}
                            </span>
                            {/*
                            {curso.estado === 'rechazado' && curso.razon_rechazo && (
                              <div style={{ fontSize: '12px', marginTop: '4px', color: '#d32f2f', maxWidth: '150px' }}>
                                <strong>Razón:</strong> {curso.razon_rechazo}
                              </div>
                            )}
                              */}
                        </div>
                    </td>
                    <td>
                        <button
                            className="btn-accion btn-inscritos"
                            onClick={() => onViewInscripciones?.(curso.id)}
                            disabled={curso.estado !== 'aprobado'}
                            title={curso.estado !== 'aprobado' ? 'El curso debe estar aprobado para ver inscritos' : ''}
                        >
                            <Eye size={14} />
                            <span>Ver</span>
                        </button>
                    </td>
                    
                    <td>
                        <button
                            className="btn-accion btn-version"
                            onClick={() => onViewVersiones?.(curso)}
                            disabled={curso.estado !== 'aprobado'}
                            title={curso.estado !== 'aprobado' ? 'El curso debe estar aprobado para ver versiones' : `Versiones anuales — año ${curso.anio ?? '?'}`}
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
                        {/*
                        <button
                            className="btn-accion btn-eliminar"
                            onClick={() => handleDeleteClick(curso)}
                        >
                            <Trash2 size={14} />
                        </button>
                        */}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
  );
}

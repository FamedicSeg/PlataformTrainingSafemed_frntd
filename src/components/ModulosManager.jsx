import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, GripVertical } from 'lucide-react';
import Swal from 'sweetalert2';
import SubirArchivoSupabase from './SubirArchivosSupabase';
import '../styles/pages/modulosManager.css';

/**
 * ModulosManager - Gestor de módulos de un curso
 * 
 * Props:
 *   - cursoId: ID del curso
 *   - onClose: callback para cerrar
 */
export default function ModulosManager({ cursoId, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModulo, setEditingModulo] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'video',
    url: '',
    contenido: ''
  });

  // Cargar módulos
  useEffect(() => {
    cargarModulos();
  }, [cursoId]);

  const cargarModulos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/modulos/curso/${cursoId}`);
      const data = await response.json();
      setModulos(data.data || []);
    } catch (error) {
      console.error('Error cargando módulos:', error);
      Swal.fire('Error', 'No se pudieron cargar los módulos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitModulo = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      Swal.fire('Error', 'El título es requerido', 'error');
      return;
    }

    // Validar que haya contenido
    if (formData.tipo !== 'texto' && !formData.url) {
      Swal.fire('Error', 'Debes subir un archivo o proporcionar una URL', 'error');
      return;
    }

    if (formData.tipo === 'texto' && !formData.contenido.trim()) {
      Swal.fire('Error', 'El contenido de texto es requerido', 'error');
      return;
    }

    try {
      const method = editingModulo ? 'PUT' : 'POST';
      const url = editingModulo
        ? `${API_URL}/api/modulos/${editingModulo.id}`
        : `${API_URL}/api/modulos`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          curso_id: cursoId,
          tipo: formData.tipo,
          url: formData.tipo === 'texto' ? null : formData.url || null,
          contenido: formData.tipo === 'texto' ? formData.contenido : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire(
        'Éxito',
        editingModulo ? 'Módulo actualizado' : 'Módulo creado',
        'success'
      );

      setFormData({ titulo: '', tipo: 'video', url: '', contenido: '' });
      setEditingModulo(null);
      setShowForm(false);
      cargarModulos();

    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleDeleteModulo = (modulo) => {
    Swal.fire({
      title: '¿Eliminar módulo?',
      text: `Se eliminará "${modulo.titulo}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/api/modulos/${modulo.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error('Error al eliminar');

          Swal.fire('Eliminado', 'Módulo eliminado correctamente', 'success');
          cargarModulos();
        } catch (error) {
          Swal.fire('Error', error.message, 'error');
        }
      }
    });
  };

  const handleEditModulo = (modulo) => {
    setEditingModulo(modulo);
    setFormData({
      titulo: modulo.titulo,
      tipo: modulo.tipo,
      url: modulo.url || '',
      contenido: modulo.contenido || ''
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingModulo(null);
    setFormData({ titulo: '', tipo: 'video', url: '', contenido: '' });
  };

  /**
   * ✅ Manejador para cuando Supabase sube el archivo exitosamente
   */
  const handleSupabaseUploadSuccess = (fileData) => {
    console.log('✅ Archivo subido a Supabase:', fileData);
    
    // Guardar el path en lugar de la URL completa
    setFormData(prev => ({
      ...prev,
      url: fileData.url, // ✅ Guardamos el path, no la URL completa
      tipo: fileData.type?.startsWith('video/') ? 'video' :
          fileData.type === 'application/pdf' ? 'pdf' :
          fileData.type?.startsWith('image/') ? 'imagen' :
          prev.tipo
    }));

    if(fileData.type && fileData.type.startsWith('video/')) {
      setFormData(prev => ({
        ...prev,
        tipo: 'video'
      }));
    } else if(fileData.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        tipo: 'pdf'
      }));
    }

    Swal.fire(
      'Éxito',
      `Archivo subido: ${fileData.name}`,
      'success'
    );
  };

  const handleSupabaseUploadError = (error) => {
    console.error('❌ Error subiendo a Supabase:', error);
    Swal.fire(
      'Error',
      'Error al subir el archivo a Supabase: ' + error.message,
      'error'
    );
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999
    }}>
      <div className="card2">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestionar Módulos</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : modulos.length === 0 ? (
                <div className="alert alert-info">
                  No hay módulos. Agrega el primero.
                </div>
              ) : (
                <div className="list-group">
                  {modulos.map((modulo, index) => (
                    <div key={modulo.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center flex-grow-1">
                        <GripVertical size={16} className="me-2 text-muted" />
                        <div>
                          <h6 className="mb-0 fw-semibold">{index + 1}. {modulo.titulo}</h6>
                          
                          <small className="text-muted">
                            Tipo: {modulo.tipo === 'texto' ? 'Texto' : modulo.tipo === 'video' ? 'Video' : modulo.tipo === 'imagen' ? 'Imagen' : modulo.tipo === 'pdf' ? 'PDF' : modulo.tipo === 'excel' ? 'Excel' : modulo.tipo === 'word' ? 'Word' : modulo.tipo === 'powerpoint' ? 'PowerPoint' : 'Desconocido'}
                            
                          </small>
                        
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => handleEditModulo(modulo)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteModulo(modulo)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary mb-3"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} className="me-1" />
                Agregar Módulo
              </button>
            </>
          ) : (
            <>
              <h6 className="mb-3">{editingModulo ? 'Editar Módulo' : 'Nuevo Módulo'}</h6>

              <form onSubmit={handleSubmitModulo}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Título *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleFormChange}
                    placeholder="Ej: Video: Introducción a la Seguridad"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tipo de Contenido *</label>
                  <select
                    className="form-control"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleFormChange}
                  >
                    <option value="video">Video (MP4, WEBM, YouTube, Vimeo)</option>
                    <option value="imagen">Imagen (PNG, JPG, WEBP)</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (XLS, XLSX)</option>
                    <option value="word">Word (DOC, DOCX)</option>
                    <option value="powerpoint">PowerPoint (PPT, PPTX)</option>
                    <option value="texto">Texto/Contenido directo</option>
                  </select>
                </div>

                {formData.tipo !== 'texto' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contenido del Módulo *</label>
                    
                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <h6 className="card-title mb-3">Aquí puedes subir tu archivo</h6>
                        <p className="text-muted small mb-3">
                          Haz clic en el botón para subir tu archivo. Para que los usuarios puedan acceder a él.
                          <br />
                          <strong>Límite:</strong> <strong>50 MB.</strong>
                        </p>
                        
                        <SubirArchivoSupabase
                          cursoId={cursoId}
                          onUploadSuccess={handleSupabaseUploadSuccess}
                          onUploadError={handleSupabaseUploadError}
                          buttonLabel="☁️ Subir archivo"
                          className="btn btn-primary"
                        />

                        {formData.url && (
                          <div className="alert alert-success mt-3 mb-0">
                            <i className="bi bi-check-circle me-2"></i>
                            <strong>Archivo cargado correctamente</strong>
                            <br />
                          </div>
                        )}
                      </div>
                    </div>

                    {!formData.url && (
                      <div className="alert alert-info">
                        <small>
                          💡 Alternativamente, puedes pegar una URL pública (YouTube, Vimeo, etc):
                        </small>
                        <input
                          type="url"
                          className="form-control form-control-sm mt-2"
                          name="url"
                          value={formData.url}
                          onChange={handleFormChange}
                          placeholder="https://example.com/archivo.mp4"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.tipo === 'texto' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contenido de Texto *</label>
                    <textarea
                      className="form-control"
                      name="contenido"
                      value={formData.contenido}
                      onChange={handleFormChange}
                      rows="6"
                      placeholder="Escribe el contenido de texto aquí..."
                    />
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button type="submit" className="btn-actualizarM">
                    {editingModulo ? 'Actualizar' : 'Crear'} Módulo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelForm}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
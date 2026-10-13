import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, GripVertical, X } from 'lucide-react';
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
    contenido: '',
    fecha_inicio_conferencia: '',
    fecha_fin_conferencia: '',
    url_conferencia: ''
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

  // Convertir fecha del input (formato local) a string para enviar al backend
  // El input datetime-local devuelve "2026-10-13T14:05" que es la hora LOCAL
  // Enviamos como es, sin convertir a UTC, para que el backend la interprete como Guayaquil
  const convertirFechaAlBackend = (fechaInput) => {
    if (!fechaInput) return null;
    // Devolver tal cual: "2026-10-13T14:05"
    // El backend lo interpretará como hora de Guayaquil
    return fechaInput;
  };

  const handleSubmitModulo = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      Swal.fire('Error', 'El título es requerido', 'error');
      return;
    }

    // Validar según el tipo
    if (formData.tipo === 'video_conferencia') {
      if (!formData.fecha_inicio_conferencia || !formData.fecha_fin_conferencia) {
        Swal.fire('Error', 'Debes especificar las fechas de inicio y fin de la videoconferencia', 'error');
        return;
      }
      if (new Date(formData.fecha_fin_conferencia) <= new Date(formData.fecha_inicio_conferencia)) {
        Swal.fire('Error', 'La fecha de fin debe ser posterior a la fecha de inicio', 'error');
        return;
      }
    } else if (formData.tipo !== 'texto' && !formData.url) {
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
          url: formData.tipo === 'texto' || formData.tipo === 'video_conferencia' ? null : formData.url || null,
          contenido: formData.tipo === 'texto' ? formData.contenido : null,
          fecha_inicio_conferencia: formData.tipo === 'video_conferencia' ? convertirFechaAlBackend(formData.fecha_inicio_conferencia) : null,
          fecha_fin_conferencia: formData.tipo === 'video_conferencia' ? convertirFechaAlBackend(formData.fecha_fin_conferencia) : null,
          url_conferencia: formData.tipo === 'video_conferencia' ? formData.url_conferencia : null
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

  // Convertir timestamp a formato datetime-local
  // Si el timestamp no tiene zona horaria explícita, asumir que es hora local (Guayaquil)
  // Si tiene zona horaria, convertir a hora local del navegador
  const aInputLocal = (valor) => {
    if (!valor) return '';
    
    // Si NO tiene indicador de zona horaria (Z o ±HH:MM), es hora local sin convertir
    // Devolver tal cual para datetime-local input
    if (!valor.includes('Z') && !valor.includes('+') && !valor.match(/-\d{2}:\d{2}$/)) {
      // Es hora local del servidor (Guayaquil), devolver sin conversión
      return valor.substring(0, 19); // "YYYY-MM-DDTHH:mm:ss"
    }
    
    // Si tiene zona horaria explícita, convertir a hora local del navegador
    const d = new Date(valor);
    if (isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  const handleEditModulo = (modulo) => {
    setEditingModulo(modulo);
    setFormData({
      titulo: modulo.titulo,
      tipo: modulo.tipo,
      url: modulo.url || '',
      contenido: modulo.contenido || '',
      fecha_inicio_conferencia: aInputLocal(modulo.fecha_inicio_conferencia),
      fecha_fin_conferencia: aInputLocal(modulo.fecha_fin_conferencia),
      url_conferencia: modulo.url_conferencia || ''
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingModulo(null);
    setFormData({ 
      titulo: '', 
      tipo: 'video', 
      url: '', 
      contenido: '',
      fecha_inicio_conferencia: '',
      fecha_fin_conferencia: '',
      url_conferencia: ''
    });
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
          <button type="button" className="panel-modal-close" onClick={onClose} aria-label="Cerrar ventana">
            <X size={20} />
          </button>
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
                            Tipo: {modulo.tipo === 'texto' ? 'Texto' : modulo.tipo === 'video' ? 'Video' : modulo.tipo === 'imagen' ? 'Imagen' : modulo.tipo === 'pdf' ? 'PDF' : modulo.tipo === 'excel' ? 'Excel' : modulo.tipo === 'word' ? 'Word' : modulo.tipo === 'powerpoint' ? 'PowerPoint' : modulo.tipo === 'video_conferencia' ? '🎥 Videoconferencia (Jitsi)' : 'Desconocido'}
                            
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
                    className="ingreso-texto-modulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleFormChange}
                    placeholder="Ej: Video: Introducción a la Seguridad"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tipo de Contenido *</label>
                  <select
                    className="ingreso-texto-modulo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleFormChange}
                  >
                    <option value="video">Video (MP4, YouTube)</option>
                    <option value="imagen">Imagen (PNG, JPG)</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (XLS, XLSX)</option>
                    <option value="word">Word (DOC, DOCX)</option>
                    <option value="powerpoint">PowerPoint (PPT, PPTX)</option>
                    <option value="texto">Texto/Contenido directo</option>
                    <option value="video_conferencia">Video Conferencia (Jitsi)</option>
                  </select>
                </div>

                {formData.tipo !== 'texto' && formData.tipo !== 'video_conferencia' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contenido del Módulo *</label>
                    
                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <h6 className="card-title mb-3"> ⬆️ Aquí puedes subir tu archivo</h6>
                        <p className="text-muted small mb-3">
                          Haz clic en el botón para subir tu archivo. Para que los usuarios puedan acceder a él.
                          <br />
                          <strong>Límite:</strong> <strong>200 MB.</strong>
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

                    {!formData.url ? (
                      <div className="alert alert-info">
                        <small>
                          En caso de que tu video sobrepase el límite de tamaño, puedes pegar una URL pública (YouTube, Vimeo, etc):
                        </small>
                        <input
                          type="url"
                          className="ingreso-texto-modulo"
                          name="url"
                          value={formData.url}
                          onChange={handleFormChange}
                          placeholder="Ingresa aquí el link del video. Ejm: https://www.youtube.com/watch?v=example"
                        />
                      </div>
                    ) : (
                      <div className="alert alert-success">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <small><strong>Archivo/URL cargado correctamente</strong></small>
                            <div 
                              className="text-break mt-2" 
                              style={{fontSize: '0.85rem', wordBreak: 'break-all', color: '#666'}}
                              title={formData.url}
                            >
                              {formData.url}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={() => setFormData(prev => ({ ...prev, url: '' }))}
                            style={{whiteSpace: 'nowrap'}}
                          >
                            ❌
                          </button>
                        </div>
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

                {formData.tipo === 'video_conferencia' && (
                  <div className="mb-3 p-3 alert alert-info" style={{backgroundColor: '#e3f2fd', borderColor: '#1976d2'}}>
                    <h6 style={{color: '#1565c0', marginBottom: '15px'}}>📺 Configurar Videoconferencia</h6>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha y Hora de Inicio *</label>
                      <input
                        type="datetime-local"
                        className="ingreso-texto-modulo"
                        name="fecha_inicio_conferencia"
                        value={formData.fecha_inicio_conferencia}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha y Hora de Fin *</label>
                      <input
                        type="datetime-local"
                        className="ingreso-texto-modulo"
                        name="fecha_fin_conferencia"
                        value={formData.fecha_fin_conferencia}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">URL de la Conferencia (Jitsi)</label>
                      <input
                        type="url"
                        className="ingreso-texto-modulo"
                        name="url_conferencia"
                        value={formData.url_conferencia}
                        onChange={handleFormChange}
                        placeholder="https://meet.jitsi.org/nombre-conferencia"
                      />
                      <small className="text-muted d-block mt-2">
                        Opcional: Si dejas esto vacío, se generará automáticamente una URL Jitsi.
                      </small>
                    </div>
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
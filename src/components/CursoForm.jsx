import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/pages/documentoForm.css';

/**
 * CursoForm - Formulario para crear/editar cursos
 * 
 * Props:
 *   - cursoId: null (crear) o number (editar)
 *   - onSave: callback cuando se guarda
 *   - onCancel: callback cuando se cancela
 *   - initialData: datos iniciales (opcional)
 */
export default function CursoForm({ cursoId = null, onSave, onCancel, initialData = null }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar datos si es editar
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre del curso es requerido');
      setLoading(false);
      return;
    }

    try {
      const method = cursoId ? 'PUT' : 'POST';
      const url = cursoId 
        ? `${API_URL}/api/cursos/${cursoId}`
        : `${API_URL}/api/cursos`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar el curso');
      }

      setSuccess(true);
      setTimeout(() => {
        onSave?.(data.data);
      }, 1500);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al guardar el curso');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="alert alert-success d-flex align-items-center">
        <CheckCircle className="me-2" size={20} />
        <div>
          <strong>{cursoId ? 'Curso actualizado' : 'Curso creado'} exitosamente</strong>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-3">
          <AlertCircle className="me-2" size={20} />
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold">
          Nombre del Curso *
        </label>
        <input
          type="text"
          className="form-control"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Seguridad Industrial 2026"
          disabled={loading}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">
          Descripción
        </label>
        <textarea
          className="form-control"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el contenido y objetivos del curso..."
          rows="4"
          disabled={loading}
        />
      </div>

      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (cursoId ? 'Actualizar' : 'Crear')} Curso
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

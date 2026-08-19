import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/pages/cursoForm.css';

//CursoForm - Formulario para crear/editar cursos
export default function CursoForm({ cursoId = null, onSave, onCancel, initialData = null }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    razon_curso: '',
    dirigido_a: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar datos si es editar
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        razon_curso: initialData.razon_curso || '',
        dirigido_a: initialData.dirigido_a || '',
        fecha_inicio: initialData.fecha_inicio ? new Date(initialData.fecha_inicio).toISOString().slice(0, 16) : '',
        fecha_fin: initialData.fecha_fin ? new Date(initialData.fecha_fin).toISOString().slice(0, 16) : ''
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

    if (!formData.razon_curso.trim()) {
      setError('La razón del curso es requerida');
      setLoading(false);
      return;
    }
    if (!formData.dirigido_a.trim()) {
      setError('El campo "Dirigido a" es requerido');
      setLoading(false);
      return;
    }

    if (formData.fecha_inicio && formData.fecha_fin && new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
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
          Nombre del Curso:
        </label>
        <input
          type="text"
          className="form-control"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ingrese el nombre del curso Ej: "
          disabled={loading}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">
          Descripción:
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

      <div className="mb-3">
        <label className="form-label fw-semibold">
          Justificación del Curso:
        </label>
        <textarea
          className="form-control"
          name="razon_curso"
          value={formData.razon_curso}
          onChange={handleChange}
          placeholder="Ejemplo: El siguiente video muestra los riesgos y prevenciones de accidentes laborales..."
          rows="4"
          disabled={loading}
          required
        />
        <small className="form-text text-muted">
          Explica por qué se crea este curso. Talento Humano lo usará para decidir si aprobarlo.
        </small>
      </div>
      <div>
        <label className="form-label fw-semibold">
          Dirigido a:
        </label>
        <textarea
          className="form-control"
          name="dirigido_a"
          value={formData.dirigido_a}
          onChange={handleChange}
          placeholder="Ejemplo: Personal de planta, contratistas, etc..."
          rows="4"
          disabled={loading}
        ></textarea>
      </div>

      <div className="row mt-3">
        <div className="col-md-6 mb-3">
          <label className="form-label fw-semibold">
            📅 Fecha y Hora de Inicio:
          </label>
          <input
            type="datetime-local"
            className="form-control"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            disabled={loading}
          />
          <small className="form-text text-muted">El curso se habilitará automáticamente en esta fecha.</small>
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label fw-semibold">
            🕑 Fecha y Hora de Fin:
          </label>
          <input
            type="datetime-local"
            className="form-control"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
            disabled={loading}
          />
          <small className="form-text text-muted">El curso se bloqueará automáticamente en esta fecha.</small>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn-crear-actualizar"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (cursoId ? 'Actualizar' : 'Crear')} Curso
        </button>
        <button
          type="button"
          className="btn-cancelar2"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

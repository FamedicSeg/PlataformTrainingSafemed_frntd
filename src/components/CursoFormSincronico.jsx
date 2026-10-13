import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/components/CursoFormAsincronico.css';

export default function CursoFormSincronico({ cursoId = null, onSave, onCancel, initialData = null }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('admin_token');

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        razon_curso: '',
        dirigido_a: '',
        duracion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo: 'Sincrónico'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [esRechazado, setEsRechazado] = useState(false);
    const [razonRechazo, setRazonRechazo] = useState('');

    // 🔄 Cargar datos iniciales si estamos editando
    useEffect(() =>{
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                descripcion: initialData.descripcion || '',
                razon_curso: initialData.razon_curso || '',
                dirigido_a: initialData.dirigido_a || '',
                duracion: initialData.duracion || '',
                fecha_inicio: initialData.fecha_inicio ? new Date(initialData.fecha_inicio).toISOString().slice(0, 16) : '',                
                fecha_fin: initialData.fecha_fin ? new Date(initialData.fecha_fin).toISOString().slice (0, 16) : '',
                tipo: 'Sincrónico'
            });

            // Detectar si es rechazado
            setEsRechazado(initialData.estado === 'rechazado');
            setRazonRechazo(initialData.razon_rechazo || '');
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

    // Convertir fecha del input (formato local) a string para enviar al backend
    // El input datetime-local devuelve "2026-10-13T14:05" que es la hora LOCAL
    // Enviamos como es, sin convertir a UTC, para que el backend la interprete como Guayaquil
    const convertirFechaAlBackend = (fechaInput) => {
        if (!fechaInput) return null;
        // Devolver tal cual: "2026-10-13T14:05"
        // El backend lo interpretará como hora de Guayaquil
        return fechaInput;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.nombre.trim()) {
            setError('El nombre del curso es obligatorio.');
            setLoading(false);
            return;
        }

        if (!formData.descripcion.trim()) {
            setError('La descripción del curso es obligatoria.');
            setLoading(false);
            return;
        }

        if (!formData.razon_curso.trim()) {
            setError('El objetivo del curso es obligatorio.');
            setLoading(false);
            return;
        }

        if (!formData.dirigido_a.trim()) {
            setError('El público al que va dirigido el curso es obligatorio.');
            setLoading(false);
            return;
        }

        if (!formData.duracion.trim()) {
            setError('La duración del curso es obligatoria.');
            setLoading(false);
            return;
        }

        if (!formData.fecha_inicio) {
            setError('La fecha y hora de inicio de la reunión es obligatoria.');
            setLoading(false);
            return;
        }

        if (!formData.fecha_fin) {
            setError('La fecha y hora de fin de la reunión es obligatoria.');
            setLoading(false);
            return;
        }

        // Validar que fecha_fin sea posterior a fecha_inicio
        if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
            setError('La fecha de fin debe ser posterior a la fecha de inicio.');
            setLoading(false);
            return;
        }

        // Validar que la fecha de inicio sea futura (solo para crear)
        if (!cursoId && new Date(formData.fecha_inicio) < new Date()) {
            setError('La fecha de inicio debe ser en el futuro.');
            setLoading(false);
            return;
        }

        try {
            const method = cursoId ? 'PUT' : 'POST';
            let url = cursoId 
                ? `${API_URL}/api/cursos/${cursoId}`
                : `${API_URL}/api/cursos`;

            // Si el curso es rechazado, usamos el endpoint especial
            if (esRechazado && cursoId) {
                url = `${API_URL}/api/cursos/${cursoId}/editar-rechazado`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    fecha_inicio: formData.fecha_inicio ? convertirFechaAlBackend(formData.fecha_inicio) : null,
                    fecha_fin: formData.fecha_fin ? convertirFechaAlBackend(formData.fecha_fin) : null
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ Curso sincrónico ${cursoId ? 'actualizado' : 'creado'}:`, data.data);
            setSuccess(true);
            
            // Llamar al onSave con los datos del curso guardado
            setTimeout(() => {
                onSave?.(data.data);
            }, 1500);

        } catch (error) {
            console.error('Error al guardar el curso sincrónico:', error.message);
            setError('Ocurrió un error al guardar el curso.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="alert alert-success d-flex align-items-center">
                <CheckCircle className="me-2" size={20} />
                <div>
                    <strong>Curso sincrónico {cursoId ? 'actualizado' : 'creado'} exitosamente</strong>
                    {!cursoId && <p>Abriendo sala de conferencia...</p>}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* Para mostrar el rechazo del curso*/}
            {esRechazado && razonRechazo && (
                <div className="alert alert-danger d-flex align-items-center">
                    <AlertCircle className="me-2 mt-1" size={16} style={{ color: '#6c0202'}}/>
                    <div>
                        <strong style={{color: '#6c0202'}}>El curso fue rechazado. Edita el curso y guárdalo para reenviarlo nuevamente.</strong>
                        <p className="rechazo-razon">
                            <strong>Razón:</strong> {razonRechazo}
                        </p>
                    </div> 
                </div>
            )}

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
                    className="ingreso-nombre-curso"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Capacitación de Seguridad - Lote 5"
                    disabled={loading}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Objetivo del Curso:
                </label>
                <textarea
                    className="ingreso-nombre-curso"
                    name="razon_curso"
                    value={formData.razon_curso}
                    onChange={handleChange}
                    placeholder="¿Cuál es el propósito principal de esta conferencia?"
                    rows="3"
                    disabled={loading}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Detalle de los Temas a tratar:
                </label>
                <textarea
                    className="ingreso-nombre-curso"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe brevemente el contenido y objetivos de la conferencia"
                    rows="4"
                    disabled={loading}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Dirigido a:
                </label>
                <textarea
                    className="ingreso-nombre-curso"
                    name="dirigido_a"
                    value={formData.dirigido_a}
                    onChange={handleChange}
                    placeholder="Ej: Personal administrativo, Equipo de seguridad"
                    rows="3"
                    disabled={loading}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Duración:
                </label>
                <input
                    type="text"
                    className="ingreso-nombre-curso"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    placeholder="Duración en horas o minutos Ejemplo: 10 horas o 30 minutos"
                    disabled={loading}
                    required
                />
            </div>

            <div className="row mt-3">
                <div className="mb-3">
                <label className="form-label fw-semibold">
                    Fecha y Hora de Inicio:
                </label>
                <input
                    type="datetime-local"
                    className="ingreso-nombre-curso"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    disabled={loading}
                    required
                />
                <small className="text-muted">Cuándo comienza la reunión</small>
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Fecha y Hora de Fin:
                </label>
                <input
                    type="datetime-local"
                    className="ingreso-nombre-curso"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    disabled={loading}
                    required
                />
                <small className="text-muted">Cuándo termina la reunión</small>
            </div>


            </div>

            <div className="d-flex gap-2">
                <button
                    type="submit"
                    className="btn-crear-actualizar"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : cursoId ? 'Actualizar' : 'Crear Curso'}
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

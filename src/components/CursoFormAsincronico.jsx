import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { aInputLocal } from '../utils/dateUtils';
import '../styles/components/CursoFormAsincronico.css';

// Formulario para el curso Asincrónico
export default function CursoFormAsincronico({ cursoId = null, onSave, onCancel, initialData = null}) {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('admin_token');
    const adminUser = JSON.parse(localStorage.getItem("admin_proceso_user") || '{}');

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        razon_curso: '',
        dirigido_a: '',
        duracion: '',
        fecha_inicio:'',
        fecha_fin: '',
        habilitar_certificado: false,
        crear_evaluacion: false  // NUEVO: Flag para crear evaluación automática
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [esRechazado, setEsRechazado] = useState(false);
    const [razonRechazo, setRazonRechazo] = useState('');
    
    // Estados para firmas
    const [firmasDisponibles, setFirmasDisponibles] = useState([]);
    const [firmasSeleccionadas, setFirmasSeleccionadas] = useState([]);
    const [cargandoFirmas, setCargandoFirmas] = useState(false);

    useEffect(() =>{
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                descripcion: initialData.descripcion || '',
                razon_curso: initialData.razon_curso || '',
                dirigido_a: initialData.dirigido_a || '',
                duracion: initialData.duracion || '',
                fecha_inicio: aInputLocal(initialData.fecha_inicio_curso || initialData.fecha_inicio),
                fecha_fin: aInputLocal(initialData.fecha_fin_curso || initialData.fecha_fin),
                habilitar_certificado: !!initialData.habilitar_certificado,
                crear_evaluacion: !!initialData.crear_evaluacion    
            });

            // Detectar si es rechazado
            setEsRechazado(initialData.estado === 'rechazado');
            setRazonRechazo(initialData.razon_rechazo || '');
        }
    }, [initialData]);

    // Cargar firmas cuando se activa el checkbox de certificado
    useEffect(() => {
        if (formData.habilitar_certificado && adminUser.proceso_name) {
            cargarFirmas();
        } else {
            setFirmasDisponibles([]);
            setFirmasSeleccionadas([]);
        }
    }, [formData.habilitar_certificado]);

    const cargarFirmas = async () => {
        setCargandoFirmas(true);
        try {
            // Obtener procesos para encontrar el ID del proceso actual
            const resProcesos = await fetch(`${API_URL}/api/procesos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const procesos = await resProcesos.json();
            
            const proceso = procesos.find(p => p.nombre === adminUser.proceso_name);
            if (!proceso) {
                console.error('Proceso no encontrado');
                setFirmasDisponibles([]);
                return;
            }

            // Cargar firmas del proceso
            const resFirmas = await fetch(
                `${API_URL}/admin/firmas/proceso/${proceso.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const firmas = await resFirmas.json();
            const lista = Array.isArray(firmas) ? firmas : [];
            setFirmasDisponibles(lista);

            // En edición, precargar las firmas ya guardadas del curso
            const idsGuardados = initialData?.firmas_ids;
            if (Array.isArray(idsGuardados) && idsGuardados.length > 0) {
                const previas = idsGuardados
                    .map(idFirma => lista.find(f => f.id === idFirma))
                    .filter(Boolean);
                setFirmasSeleccionadas(prev => (prev.length > 0 ? prev : previas));
            }
        } catch (err) {
            console.error('Error cargando firmas:', err);
            setFirmasDisponibles([]);
        } finally {
            setCargandoFirmas(false);
        }
    };

    const handleSeleccionarFirma = (firma) => {
        if (firmasSeleccionadas.some(f => f.id === firma.id)) {
            setFirmasSeleccionadas(firmasSeleccionadas.filter(f => f.id !== firma.id));
        } else if (firmasSeleccionadas.length < 3) {
            setFirmasSeleccionadas([...firmasSeleccionadas, firma]);
        }
    };

    const handleRemoverFirma = (idFirma) => {
        setFirmasSeleccionadas(firmasSeleccionadas.filter(f => f.id !== idFirma));
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked: value // Para manejar los checkboxes 
        }));
        setError ('');
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

        if (!formData.descripcion.trim()){
            setError('La descripción del curso es obligatoria');
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

        if (formData.habilitar_certificado && !formData.crear_evaluacion) {
            setError('Debes obligatoriamente realizar una evaluación para emitir un certificado. Activa la casilla de evaluación.');
            setLoading(false);
            return;
        }

        if (formData.fecha_inicio && formData.fecha_fin && new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
            setError('La fecha de fin debe ser posterior a la fecha de inicio.');
            setLoading(false);
            return;
        }

        try {
            const method = cursoId ? 'PUT' : 'POST';
            let url = cursoId 
                ? `${API_URL}/api/cursos/${cursoId}`
                : `${API_URL}/api/cursos`;

                // Si el curso es rechazdo, usamos el endpoint especial
                if (esRechazado && cursoId) {
                    url = `${API_URL}/api/cursos/${cursoId}/editar-rechazado`;
                }

                const bodyData = {
                    ...formData,
                    fecha_inicio: formData.fecha_inicio ? convertirFechaAlBackend(formData.fecha_inicio) : null,
                    fecha_fin: formData.fecha_fin ? convertirFechaAlBackend(formData.fecha_fin) : null,
                    firmas_seleccionadas: formData.habilitar_certificado ? firmasSeleccionadas.map(f => f.id) : []
                };
                
                console.log('📤 Enviando datos del curso:', bodyData);
                console.log('   - habilitar_certificado:', formData.habilitar_certificado);
                console.log('   - crear_evaluacion:', formData.crear_evaluacion);
                console.log('   - firmas_seleccionadas:', bodyData.firmas_seleccionadas);

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(bodyData)
                });

                const data = await response.json();
                if (!response.ok) {
                    console.error('Error al guardar el curso:');
                    console.error('Status:', response.status, response.statusText);
                    console.error('Response:', JSON.stringify(data, null, 2));
                    console.error('FormData enviado:', JSON.stringify(formData, null, 2));

                    throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
                }
                setSuccess(true);
                setTimeout(() => { onSave?.(data.data); }, 1500);
        } catch (error){
            console.error ('Error en handleSubmit: ', error.message);
            console.error('Stack:', error.stack);
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
                    <strong>{cursoId ? 'Curso actualizado': 'Curso creado'} exactamente</strong>
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
                        <strong style={{color: '#6c0202'}}>El curso fue rechazado. Edita el curso y guardalo para reenviarle nuevamente.</strong>
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
                    Tema de la Formación:
                </label>
                <input
                    type="text"
                    className="ingreso-nombre-curso"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ingresa el nombre del curso"
                    disabled={loading}
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Objetivo del curso:
                </label>
                <textarea
                    className="ingreso-nombre-curso"
                    name="razon_curso"
                    value={formData.razon_curso}
                    onChange={handleChange}
                    placeholder="Describe el objetivo de aprendizaje del curso"
                    rows="4"
                    disabled={loading}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-semibold">
                    Detalle de Temas a tratar:
                </label>
                <textarea
                    className="ingreso-nombre-curso"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe los temas que se tratarán en el curso"
                    rows="4"
                    disabled={loading}
                    required
                />
                <div>
                    <label className="form-label fw-semibold">
                        Dirigido a:
                    </label>
                    <textarea
                        className="ingreso-nombre-curso"
                        name="dirigido_a"
                        value={formData.dirigido_a}
                        onChange={handleChange}
                        placeholder="Describe a quién está dirigido el curso"
                        rows="4"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="mb-3 mt-3">
                    <label className="form-label fw-semibold">
                        Duración del curso:
                    </label>
                    <input
                        type="text"
                        className="ingreso-nombre-curso"
                        name="duracion"
                        value={formData.duracion}
                        onChange={handleChange}
                        placeholder="Ingresa la duración del curso"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="row mt-3">
                    <div className="col-md-6 mb-3">
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
                    </div>
                    <div className="col-md-6 mb-3">
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
                    </div>
                </div>

                {/* Opción para habilitar certificados*/}
                <div className="mb-3 mt-4 p-3" style={{ backgroundColor: '#e9eff5', borderRadius: '8px', border: '1px solid #00b8c6' }}>
                    <div className="form-check">
                        <input
                            className="form-check-input custom-check"
                            type="checkbox"
                            name="habilitar_certificado"
                            checked={formData.habilitar_certificado}
                            onChange={handleChange}
                            disabled={loading}
                            style={{ cursor: 'pointer', width: '18px', height: '18px', border: '1px solid #00b8c6', }}/>
                        <label className="form-check-label" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                           ¿Deseas habilitar la entrega de Certificado? (Activa la casilla 🗹)
                        </label>
                    </div>

                    {/* Panel de selección de firmas */}
                    {formData.habilitar_certificado && (
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9eff5', borderRadius: '6px', border: '1px solid #00b8c6' }}>
                            <h5 style={{ color: '#03737b', marginBottom: '15px', marginTop: '0', fontSize: '18px', fontWeight: 'bold' }}>Selecciona las Firmas para el Certificado</h5>
                            
                            {cargandoFirmas && <p style={{ color: '#797979' }}>Cargando firmas...</p>}
                            
                            {!cargandoFirmas && firmasDisponibles.length === 0 && (
                                <p style={{ color: '#ff9800' }}>⚠️ No hay firmas disponibles para tu proceso. Primero crea firmas en el panel de Gestionar Firmas.</p>
                            )}
                            
                            {!cargandoFirmas && firmasDisponibles.length > 0 && (
                                <>
                                    {/* Firmas disponibles */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                        {firmasDisponibles.map(firma => (
                                            <div
                                                key={firma.id}
                                                onClick={() => handleSeleccionarFirma(firma)}
                                                style={{
                                                    padding: '12px',
                                                    border: firmasSeleccionadas.some(f => f.id === firma.id) ? '3px solid #00b8c6' : '2px solid #ccc',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    backgroundColor: firmasSeleccionadas.some(f => f.id === firma.id) ? '#d4f1f7' : '#fff',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <img 
                                                    src={firma.imagen_firma_url} 
                                                    alt={firma.nombre_admin}
                                                    style={{ maxWidth: '100%', maxHeight: '60px', marginBottom: '8px' }}
                                                />
                                                <p style={{ fontSize: '12px', margin: '0', color: '#333', fontWeight: 'bold' }}>{firma.nombre_admin}</p>
                                                <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#666' }}>{firma.cargo}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Firmas seleccionadas */}
                                    <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ccc' }}>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                            Firmas Seleccionadas: {firmasSeleccionadas.length}/3
                                        </p>
                                        {firmasSeleccionadas.length === 0 ? (
                                            <p style={{ color: '#999', margin: '0' }}>Selecciona al menos 1 firma</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {firmasSeleccionadas.map(firma => (
                                                    <div
                                                        key={firma.id}
                                                        style={{
                                                            padding: '8px 12px',
                                                            backgroundColor: '#d4f1f7',
                                                            border: '1px solid #00b8c6',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{firma.nombre_admin}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoverFirma(firma.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '0',
                                                                color: '#d32f2f'
                                                            }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="mb-3 mt-4 p-3" style={{ backgroundColor: '#e9eff5', borderRadius: '8px', border: '1px solid #00b8c6' }}>
                    {/* Opción para crear evaluación automática - NUEVO */}
                        <div className="form-check">
                            <input
                                className="form-check-input custom-check"
                                type="checkbox"
                                name="crear_evaluacion"
                                checked={formData.crear_evaluacion}
                                onChange={handleChange}
                                disabled={loading}
                                style={{ cursor: 'pointer', width: '18px', height: '18px', border: '1px solid #0066cc' }}
                            />
                            <label className="form-check-label" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                               ¿Deseas realizar una evaluación? (Activa la casilla 🗹)
                            </label>
                        </div>
                        <small style={{ display: 'block', marginTop: '8px', color: '#616060' }}>
                            Si activas esta opción, te permitirá crear una evaluación para los usuarios.
                        </small>
                </div>
                {/* Botones de envío */}
                    <div className="d-flex gap-2 mt-4">
                        <button type="submit" className="btn-crear-actualizar" disabled={loading || (formData.habilitar_certificado && firmasSeleccionadas.length === 0)}>
                            {loading ? 'Guardando...': (cursoId ? 'Actualizar' : 'Crear')} Curso
                        </button>
                        <button type="button" className="btn-cancelar2" onClick={onCancel} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
            </div>
        </form>
    );
};
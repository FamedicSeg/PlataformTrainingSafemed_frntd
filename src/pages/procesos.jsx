import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import "../styles/pages/procesos.css"

export default function Procesos(){
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL;

    const [expandido, setExpandido] = useState(null);
    const [cursos, setCursos] = useState([]);
    const [pendientesPorProceso, setPendientesPorProceso] = useState({});

    const processes =[
        {id:16, name: "Talento Humano", desc: "Capacitación de Talento Humano" ,link: "/courses/tthh", enabled: true},
        {id:14, name: "Seguridad Industrial", desc: "Capacitación de Seguridad Industrial", link:"/courses/seguridad-industrial", enabled: true},
        {id:12, name: "Salud Ocupacional", desc: "Capacitación de Salud Ocupacional", link:"/courses/salud-ocupacional", enabled: true},
        {id:11, name: "Operaciones - Producción", desc: "Capacitación de Producción", link: "/courses/operaciones", enabled: true},
        {id:3, name: "Asuntos Regulatorios y Control de Calidad" , desc: "Capacitación de Control de Calidad" ,link: "/courses/asuntosRegulatorios", enabled: true},
        {id:2, name: "Aseguramiento de la Calidad y Seguridad" , desc: "Capacitación de Aseguramiento de la Calidad y Seguridad" , link: "/courses/sgcs", enabled: true},
        {id:1, name: "Almacenamiento y Logística", desc: "Capacitación de Almacenamiento y Logística", link:"/courses/almacenamientoLogistica", enabled: true},
        {id:15, name: "Seguridad Informática", desc: "Capacitación de la Seguridad en la Información", link:"/courses/seguridadInformatica", enabled: true},        
        {id:5, name: "Gerencia", desc: "Capacitación de Dirección", link:"/courses/gerencia", enabled: true},
        {id:7, name: "Gestión Comercial", desc: "Capacitación de Gestión Comercial", link:"/courses/ventas", enabled: true},
        {id:9, name: "Desarrollo e Investigación", desc: "Capacitación de Desarrollo e Investigación", link:"/courses/investigacionDesarrollo", enabled: true},
        {id:4, name: "Compras e Importaciones", desc: "Capacitación de Compras", link:"/courses/compras", enabled: true},
        {id:10, name: "Marketing", desc: "Capacitación de Marketing", link:"/courses/marketing", enabled: true},
        {id:13, name: "Seguridad Física", desc: "Capacitación de la Seguridad Física", link:"/courses/seguridad-fisica", enabled: true},
        {id:8, name: "Infraestructura y Mantenimiento", desc: "Capacitación de Infraestructura y Mantenimiento", link:"/courses/mantenimiento", enabled: true},
    ];

    useEffect(() => {
        cargarCursos();
        cargarPendientes();
    }, []);

    const cargarCursos = async () => {
        try {
            const response = await fetch(`${API_URL}/api/cursos/disponibles`);
            const data = await response.json();
            setCursos(data.data || []);
        } catch (error) {
            console.error('Error cargando cursos:', error);
        }
    };

    const cargarPendientes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/inscripciones/pendientes-por-proceso`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.data) {
                const mapa = {};
                data.data.forEach(item => {
                    mapa[item.proceso_id] = item.pendientes;
                });
                setPendientesPorProceso(mapa);
            }
        } catch (error) {
            console.error('Error cargando pendientes por proceso:', error);
        }
    };

    const toggleExpandir = (procesoId) => {
        if (expandido === procesoId) {
            setExpandido(null);
        } else {
            setExpandido(procesoId);
            cargarCursos();
        }
    };

    const obtenerCursosProceso = (procesoName) => {
        return cursos.filter(c => c.proceso_name === procesoName && c.activo);
    };

    useEffect(() => {
        if(location.state && location.state.refrescar){
            navigate(location.pathname, { replace: true, state: {}});
            cargarCursos();
            cargarPendientes();
        }
    }, [navigate, location]);

    return(
        <div className='container contenedor-principal py-5 mt-5'>
            <div className='contenedor-procesos-princ'>
                <div className='text-center mb-5'>
                    <h2> Bienvenido a la plataforma de Capacitación DHISVE</h2>
                    <p className='subtitulo-pagina'> SELECCIONA EL PROCESO QUE DESEAS INGRESAR</p>
                </div>
                <div className='tarjetas-row-procesos'>
                {processes.map((proceso)=>{
                    const _cursosDelProceso = obtenerCursosProceso(proceso.name);
                    const estaExpandido = expandido === proceso.id;
                    
                    return (
                    <div key={proceso.id} className='columna-proceso'>
                        <div className={`card card-curso shadow-sm h-100 ${!proceso.enabled ? 'card-disabled' : ''}`} style={{
                            cursor: proceso.enabled ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                            minHeight: estaExpandido ? 'auto' : '250px'
                        }}>
                            <div 
                                className='card-body d-flex flex-column'
                                onClick={() => proceso.enabled && toggleExpandir(proceso.id)}
                                style={{
                                    backgroundColor: estaExpandido && proceso.enabled ? '#f8f9fa' : 'transparent',
                                    cursor: proceso.enabled ? 'pointer' : 'default',
                                    padding: '1.5rem'
                                }}>
                                <div className='d-flex justify-content-between align-items-start mb-2'>
                                    <h5 className='titulo-curso mb-0'>
                                        {proceso.name}
                                    </h5>
                                    <div className='d-flex gap-2 align-items-start'>
                                        {pendientesPorProceso[proceso.id] > 0 && (
                                            <span className='badge bg-danger' style={{ fontSize: '0.75rem', padding: '0.5rem 0.6rem' }}>
                                                {pendientesPorProceso[proceso.id]}
                                            </span>
                                        )}
                                        {proceso.enabled && (
                                            <ChevronDown 
                                                size={20} 
                                                style={{
                                                    transform: estaExpandido ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <p className='descripcion-curso'>
                                    {proceso.desc}
                                </p>

                                <button 
                                    className={`btn w-100 mt-auto ${proceso.enabled ? 'btn-continuar2' : 'btn-disabled'}`}
                                    style={{
                                        backgroundColor: !proceso.enabled ? '#eaeaea' : '',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(proceso.enabled) {
                                            navigate(proceso.link, {
                                                state:{ courseId: proceso.id}
                                            })
                                        }
                                    }}
                                    disabled={!proceso.enabled}
                                >
                                    {proceso.enabled ? 'Iniciar Proceso' : '🔒 Próximamente'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
                })}
            </div>
            </div>
        </div>
    );
}

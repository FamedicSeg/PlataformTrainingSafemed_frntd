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
    //const [loading, setLoading] = useState(false);

    const processes =[
        {id:1, name: "Talento Humano", desc: "Capacitación de Talento Humano" ,link: "/courses/tthh", enabled: true},
        {id:2, name: "Seguridad Industrial", desc: "Capacitación de Seguridad Industrial", link:"/courses/seguridad-industrial", enabled: false},
        {id:3, name: "Salud Ocupacional", desc: "Capacitación de Salud Ocupacional", link:"/courses/salud-ocupacional", enabled: false},
        {id:4, name: "Operaciones - Producción", desc: "Capacitación de Producción", link: "/courses/operaciones", enabled: false},
         //Segunda Fila
        {id:5, name: "Asuntos Regulatorios y Control de Calidad" , desc: "Capacitación de Control de Calidad" ,link: "/courses/asuntosRegulatorios", enabled: false},
        {id:6, name: "Aseguramiento de la Calidad y Seguridad" , desc: "Capcitación de SGCS" , link: "/courses/sgcs", enabled: false},
        {id:7, name: "Almacenamiento y Logística", desc: "Capacitación de Almacenamiento y Logística", link:"/courses/almacenamientoLogistica", enabled: false},
        {id:8, name: "Seguridad Informática", desc: "Capacitación de la Seguridad en la Información", link:"/courses/seguridadInformatica", enabled: false},        
        //Tercera Fila
        {id:9, name: "Gerencia", desc: "Capacitación de Dirección", link:"/courses/gerencia", enabled: false},
        {id:10, name: "Gestión Comercial", desc: "Capacitación de Gestión Comercial", link:"/courses/ventas", enabled: false},
        {id:11, name: "Desarrollo e Investigación", desc: "Capacitación de Desarrollo e Investigación", link:"/soporte", enabled: false},
        {id:12, name: "Compras e Importaciones", desc: "Capacitación de Compras", link:"/courses/compras", enabled: false},
        //Cuarta Fila
        {id:13, name: "Marketing", desc: "Capacitación de Marketing", link:"/courses/marketing", enabled: false},
        {id:14, name: "Seguridad Física", desc: "Capacitación de la Seguridad Física", link:"/soporte", enabled: false},
        {id:15, name: "Infraestructura y Mantenimiento", desc: "Capacitación de Infraestructura y Mantenimiento", link:"/courses/mantenimiento", enabled: false},
        {id:16, name: "Investigación y Desarrollo", desc: "Capacitación de Investigación y Desarrollo", link:"/courses/investigacionDesarrollo", enabled: false}
    ];

    // Cargar cursos de la API
    useEffect(() => {
        cargarCursos();
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
        }
    }, [navigate, location]);

    return(
        <div className='container contenedor-principal py-5 mt-5'>
            <div className='container-wide'>
                <div className='text-center mb-5'>
                    <h2> Bienvenido a la plataforma de Capacitación DHISVE</h2>
                    <p className='subtitulo-pagina'> SELECCIONA EL PROCESO QUE DESEAS INGRESAR</p>
                </div>
                <div className='row g-4 mb-5'>
                {processes.map((proceso)=>{
                    const _cursosDelProceso = obtenerCursosProceso(proceso.name);
                    const estaExpandido = expandido === proceso.id;
                    
                    return (
                    <div key={proceso.id} className='col-md-3'>
                        <div className={`card card-curso shadow-sm h-100 ${!proceso.enabled ? 'card-disabled' : ''}`} style={{
                            cursor: proceso.enabled ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                            minHeight: estaExpandido ? 'auto' : '250px'
                        }}>
                            {/* Header - Clickeable para expandir */}
                            <div 
                                className='card-body d-flex flex-column'
                                onClick={() => proceso.enabled && toggleExpandir(proceso.id)}
                                style={{
                                    backgroundColor: estaExpandido && proceso.enabled ? '#f8f9fa' : 'transparent',
                                    cursor: proceso.enabled ? 'pointer' : 'default',
                                    padding: '1.5rem'
                                }}
                            >
                                <div className='d-flex justify-content-between align-items-start mb-2'>
                                    <h5 className='titulo-curso mb-0'>
                                        {proceso.name}
                                    </h5>
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
                                <p className='descripcion-curso'>
                                    {proceso.desc}
                                </p>

                                {/* Botón principal */}
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

                            {/* Sección expandible - Cursos 
                            {estaExpandido && proceso.enabled && (
                                <div style={{
                                    borderTop: '1px solid #dee2e6',
                                    backgroundColor: '#f8f9fa',
                                    padding: '1rem',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    <h6 className='mb-3 text-muted'>
                                        <BookOpen size={16} className='me-2 mb-1' style={{display: 'inline'}} />
                                        Cursos del Proceso
                                    </h6>

                                    {cursosDelProceso.length === 0 ? (
                                        <div className='text-center text-muted py-3'>
                                            <p className='mb-0 small'>No hay cursos creados aún</p>
                                        </div>
                                    ) : (
                                        <div className='list-group list-group-flush'>
                                            {cursosDelProceso.map((curso) => (
                                                <div 
                                                    key={curso.id} 
                                                    className='list-group-item list-group-item-action border-0 px-0 py-2'
                                                    style={{
                                                        cursor: 'default',
                                                        backgroundColor: 'transparent',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <div className='d-flex align-items-start'>
                                                        <span className='badge bg-success me-2 mt-1'>✓</span>
                                                        <div className='flex-grow-1'>
                                                            <div className='fw-500'>{curso.nombre}</div>
                                                            <small className='text-muted d-block'>{curso.descripcion}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )} 
                                */}
                        </div>
                    </div>
                )
                })}
            </div>
            </div>
        </div>
    );
}
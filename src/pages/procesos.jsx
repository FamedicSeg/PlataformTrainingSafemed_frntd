import {_useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/pages/procesos.css"

export default function Procesos(){
    const navigate = useNavigate();
    const location = useLocation();

    const courses =[
        {id:1, name: "Talento Humano" ,desc: "Capacitación de Talento Humano" ,link: "/courses" },
        {id:2, name: "Aseguramiento de la Calidad y Seguridad" , desc: "Capcitación de SGCS" , link: "/inicio"},
        {id:3, name: "Control de Calidad" , desc: "Capacitación de Control de Calidad" ,link: "/inicio"},
        {id:4, name: "Producción", desc: "Capacitación de Producción", link: "/principal"},
        {id:5, name: "Salud Ocupacional", desc: "Capacitación de Salud Ocupacional", link:"/principal"},
        {id:6, name: "Seguridad Industrial", desc: "Capacitación de Seguridad Industrial", link:"/principal"},
    ];

    //const [progress, setProgress] = useState(0);


    useEffect(() => {
        if(location.state && location.state.refrescar){
            navigate(location.pathname, { replace: true, state: {}});
        }
    }, [navigate]);

    return(
        <div className='container contenedor-principal py-5 mt-5'>
            <div className='container-wide'>
                <div className='text-center mb-5'>
                    <h2> Bienvenido a la plataforma de Capacitación DHISVE</h2>
                    <p className='subtitulo-pagina'> SELECCIONA EL PROCESO QUE DESEAS INGRESAR</p>
                </div>
                <div className='row g.4 mb-5'>
                {courses.map((c)=>(
                    <div key={c.id} className='col-md-3'>
                        <div className='card card.curso shadow-sm h-100'>
                            <div className='card-body d-flex flex-column'>
                                <h5 className='titulo-curso'>
                                    {c.name}
                                </h5>
                                <p className='descripcion-curso'>
                                    {c.desc}
                                </p>
                                <button 
                                className='btn btn-continuar2 w-100 mt-3'
                                onClick={()=>
                                    navigate(c.link,{
                                        state:{ courseId: c.id}
                                    })
                                }
                                >
                                    Iniciar Curso
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
    
}
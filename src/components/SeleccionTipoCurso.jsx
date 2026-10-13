import React, { useState } from 'react';
import { Video, BookOpen } from 'lucide-react';
import '../styles/components/SeleccionTipoCurso.css';

const SeleccionTipoCurso = ( { onSeleccionar, onCancelar }) => {
    const [tipoCurso, setTipoCurso] = useState(null);

    const handleSeleccion = (tipo) => {
        setTipoCurso(tipo);
        if (onSeleccionar) {
            onSeleccionar(tipo);
        }
    };

    return (
        <div className="seleccion-tipo-container">
            <div className="seleccion-tipo-curso-modal">
                <h2 className="titulo-seleccion-tipo">Selecciona el Tipo de Capacitación que deseas realizar</h2>
                <p className="subtitulo">Elige el formato que mejor se adapte a tu objetivo</p>
                <div className="opciones-tipo-curso">
                    {/* Para la opción asincrónico */}
                    <div className={`opcion-card ${tipoCurso === 'asincronico' ? 'selected': ''}`}
                        onClick={() => handleSeleccion('asincronico')}
                    >
                        <div className="icono">
                            <BookOpen size={50}/>
                        </div>
                        <h3>Asincrónico</h3>
                    
                        <ul className="caracteristicas-asincronico">
                            <li>Acceso a contenido en cualquier momento</li>
                            <li>Flexibilidad de horario</li>
                            <li>Aprendizaje a tu propio ritmo</li>
                            <li>Material descargable</li>
                        </ul>
                    </div>
                    

                    {/* Para la opción sincrónico */}
                    <div className = {`opcion-card ${tipoCurso === 'sincronico' ? 'selected' : ''}`}
                        onClick={() => handleSeleccion('sincronico')}
                    >
                        <div className="icono">
                            <Video size={48}/>
                        </div>
                        <h3>Sincrónico</h3>
                        <ul className="caracteristicas-sincronico">
                        <li>Videoconferencia en Vivo</li>
                        <li>Interacción directa</li>
                        <li>Preguntas en tiempo real</li>
                        <li>Preguntas en tiempo real</li>
                        <li>Grabación disponible</li>
                    </ul>
                    </div>
                  </div>  
                  <div className="contenedor-b">
                    <button className="boton-cancelar5" onClick={onCancelar}>
                        Cancelar
                    </button>
                </div>
                  
                </div>
                
            </div>
    )
}

export default SeleccionTipoCurso;
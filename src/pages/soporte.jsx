import "../styles/pages/inicio.css";

export default function Soporte() {
    const usuario = localStorage.getItem("usuario") || "Usuario";

    return(
        <div className="inicio-container">
            <div className="inicio-card">
                <h1 className="inicio-title">
                    Estimado Usuario , <span className="nombre">{usuario}</span>
                </h1>
                
                <p className="inicio-text">
                    Estamos realizando mejoras en la plataforma para brindarte una mejor experiencia. 
                    Muy pronto tendrás acceso a nuevos cursos y en la ampliación de contenidos formativos. 
                    En breve podrás acceder a nuevos materiales de capacitación.
                </p>

        <div className="inicio-logos">
          
          
        </div>

        <button
          className="inicio-btn"
          onClick={() => window.location.href = "/procesos"}
        >
          Comenzar Capacitación
        </button>

      </div>
    </div>
  );
}
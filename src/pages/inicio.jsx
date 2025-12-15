import "../styles/pages/inicio.css";

export default function Home() {

  const usuario = localStorage.getItem("usuario") || "Usuario";

  return (
    <div className="inicio-container">

      <div className="inicio-card">
        
        <h1 className="inicio-title">
          Bienvenido, <span className="nombre">{usuario}</span>
        </h1>

        <p className="inicio-subtitle">
          Plataforma de Capacitación Interna - DHISVE
        </p>

        <p className="inicio-text">
          En esta plataforma encontrarás cursos diseñados para fortalecer tus competencias 
          profesionales, impulsar tu desarrollo dentro de la empresa y potenciar tus 
          habilidades interpersonales para una integración óptima en los equipos de trabajo.
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

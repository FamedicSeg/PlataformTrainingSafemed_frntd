import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../styles/pages/documentoForm.css";

export default function DocumentoForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;
  const nombre = localStorage.getItem("usuario");
  const cursoNombre = location.state?.cursoNombre || "Reglamento Interno de Trabajo";
  
  const [formData, setFormData] = useState({
    apellidosNombres: "",
    ciPasaporte: "",
    proceso: "",
    cargo: "",
    fechaRecepcion: ""
  });
  
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [_datosUsuario, setDatosUsuario] = useState(null);
  
  // Cargar datos del usuario si existen
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const res = await fetch(`${API_URL}/api/usuario/${nombre}`);
        if (res.ok) {
          const data = await res.json();
          setDatosUsuario(data);
          setFormData(prev => ({
            ...prev,
            apellidosNombres: data.nombreCompleto || nombre || "",
            ciPasaporte: data.identificacion || "",
            proceso: data.proceso || "",
            cargo: data.cargo || ""
          }));
        }
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      }
    };
    
    if (nombre) cargarDatosUsuario();
  }, [nombre, API_URL]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    
    try {
      const response = await fetch(`${API_URL}/api/documentos/guardar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: nombre,
        curso: cursoNombre,
        apellidosNombres: formData.apellidosNombres,
        ciPasaporte: formData.ciPasaporte,
        proceso: formData.proceso,
        cargo: formData.cargo,
        fechaRecepcion: formData.fechaRecepcion
      })
    });
      
      const data = await response.json();
    console.log("Respuesta del servidor:", data);
    
    if (response.ok) {
      setEnviado(true);
      setTimeout(() => {
        navigate("/courses");
      }, 3000);
    } else {
      // 📌 Muestra el error real del servidor
      alert(`Error: ${data.error || data.message || "Error al enviar el documento. Si su número de cédula empieza con 0, digite pero sin el número 0 al inicio."}`);
    }
  } catch (error) {
    console.error("Error detallado:", error);
    alert(`Error de conexión: ${error.message}`);
  } finally {
    setEnviando(false);
  }
};
  
  if (enviado) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="alert alert-success shadow">
          <h4>✓ ¡Documento enviado exitosamente!</h4>
          <p>Redirigiendo al inicio...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="documento-container">
      <div className="documento-papel">
        <form onSubmit={handleSubmit}>
          <h1 className="titulo-documento">RECIBO CONFORME</h1>
          
          <div className="contenido-documento">
            <p className="parrafo">
              Acepto conforme la recepción del <strong>Reglamento Interno de Trabajo, Código de Ética y la Política de Responsabilidad Social de la Compañía Limitada Famedic.</strong>
            </p>
            
            <p className="parrafo">
              Reconozco haber sido notificado de que debo leer, conocer, entender y cumplir con los artículos contenidos en dichos documentos.
            </p>
            
            <p className="parrafo">
              Me comprometo a cumplir fielmente lo dispuesto en el <strong>Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social.</strong> Entiendo que el obrar en contra de estos por acción u omisión, suministrará suficiente base para aplicar las sanciones correspondientes o dar por terminado mi contrato de trabajo.
            </p>
            
            <div className="campos-formulario">
              <div className="campo-linea">
                <label className="campo-label">Apellidos y Nombres:</label>
                <input
                  type="text"
                  className="campo-input"
                  name="apellidosNombres"
                  value={formData.apellidosNombres}
                  onChange={handleChange}
                  required
                  placeholder="Escriba sus apellidos y nombres completos"
                />
              </div>
              
              <div className="campo-linea">
                <label className="campo-label">C.I./ Pasaporte:</label>
                <input
                  type="text"
                  className="campo-input"
                  name="ciPasaporte"
                  value={formData.ciPasaporte}
                  onChange={handleChange}
                  required
                  placeholder="Escriba su número de identificación. Si su número de cédula empieza con 0, digite pero sin el número 0 al inicio."
                />
              </div>
              
              <div className="campo-linea">
                <label className="campo-label">Proceso:</label>
                <input
                  type="text"
                  className="campo-input"
                  name="proceso"
                  value={formData.proceso}
                  onChange={handleChange}
                  required
                  placeholder="Área o proceso al que pertenece"
                />
              </div>
              
              <div className="campo-linea">
                <label className="campo-label">Cargo:</label>
                <input
                  type="text"
                  className="campo-input"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                  placeholder="Su cargo actual"
                />
              </div>
              
              <div className="campo-linea">
                <label className="campo-label">Fecha de Recepción:</label>
                <input
                  type="date"
                  className="campo-input"
                  name="fechaRecepcion"
                  value={formData.fechaRecepcion}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="firma-entregado">
              <div className="entregado-por">
                <div className="entregado-por" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <p><strong>Entregado por:</strong> ABIGAIL CISNEROS</p>
                  <p style={{ textAlign: 'right' }}><strong>Cargo:</strong> JEFE DE TALENTO HUMANO</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="botones-documento">
            <button type="button" className="btn-cancelar" onClick={() => navigate("/courses")}>
              Cancelar
            </button>
            <button type="submit" className="btn-enviar" disabled={enviando}>
              {enviando ? "Enviando..." : "✓ Enviar Documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
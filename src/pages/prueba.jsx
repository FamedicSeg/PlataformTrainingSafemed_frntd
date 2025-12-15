import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/pages/prueba.css";

export default function Prueba() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;

  const _courseId = location.state?.courseId || 0;

  const [yaAprobado, setYaAprobado] = useState(false);
  const [mostrandoResultado, setMostrandoResultado] = useState(false);

  // VERIFICAR SI YA APROBÓ ANTES - MODIFICADO
  useEffect(() => {
    // Si estamos mostrando un resultado, no cambiamos el estado de yaAprobado
    if (mostrandoResultado) return;

    const usuario = localStorage.getItem("usuario");

    // Verificar localStorage
    if (localStorage.getItem("pruebaAprobada") === "true") {
      setYaAprobado(true);
      return;
    }

    const verificarProgreso = async () => {
      try {
        const res = await fetch(`${API_URL}/api/progreso/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            nombre: usuario,
            proceso: "talento_humano"
          }),
        });

        if (!res.ok) return;
        
        const data = await res.json();
        console.log("🔍 Datos recibidos del backend:", data);

        // Verificar ambos casos posibles
        if (data.pruebaAprobada === true || data.prueba_aprobada === true) {
          localStorage.setItem("pruebaAprobada", "true");
          setYaAprobado(true);
          console.log("✅ Usuario ya tenía prueba aprobada en BD");
        } else {
          console.log("❌ Usuario NO tiene prueba aprobada aún");
        }

      } catch (err) {
        console.error("Error verificando progreso/prueba:", err);
      }
    };

    verificarProgreso();
  }, [mostrandoResultado]);

  // FINALIZAR PRUEBA - MODIFICADO
  const finalizarPrueba = async (aprobado) => {
    const usuario = localStorage.getItem("usuario");

    // Guardamos localmente SOLO si aprobó
    if (aprobado) {
      localStorage.setItem("pruebaAprobada", "true");
      // No establecemos yaAprobado aquí para evitar conflicto
    }

    // Actualizamos en la base de datos
    try {
      const res = await fetch(`${API_URL}/api/progreso/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: usuario,
          prueba_aprobada: aprobado
        }),
      });

      const result = await res.json();
      console.log("✅ Respuesta del backend:", result);

      if (result.ok) {
        console.log("🎉 BD actualizada correctamente");
      } else {
        console.error("❌ Error del backend:", result.error);
      }

    } catch (error) {
      console.error("❌ Error actualizando BD:", error);
    }

    alert("Prueba completada");
  };

  // FUNCIÓN PARA CREAR LAS PREGUNTAS
  const questions = [
    {
      id: 1,
      text: "¿Cuál es el principio fundamental en los derechos laborales de hombres y mujeres?",
      options: [
        "Que los hombres tengan prioridad en ascensos por su fuerza física.",
        "Que las mujeres ganen menos porque trabajan menos horas.",
        "Recibir igual remuneración por igual trabajo, sin importar el género."
      ],
      correct: 2
    },
    {
      id: 2,
      text: "¿Qué acción constituye discriminación laboral por razón de género?",
      options: [
        "Negar un empleo a una persona por ser hombre o mujer.",
        "Implementar licencias de maternidad y paternidad.",
        "Ofrecer capacitaciones para todo el personal."
      ],
      correct: 0
    },
    {
      id: 3,
      text:"¿Cuál de las siguientes opciones es la base de la Justicia Laboral, Igualdad y Cero Discriminación?",
      options:[
        "Entorno libre de violencia.",
        "Más trabajo laboral a las mujeres.",
        "Aumento de sueldo a los hombres."
      ],
      correct: 0
    },
    {
      id:4,
      text:"¿Cuál es el objetivo de la LOIS (LEY ORGÁNICA PARA LA IGUALDAD SALARIAL)?",
      options:
      [
        "Los trabajadores deben tener puestos dependiendo del género.",
        "Garantizar que hombres y mujeres reciban la misma remuneración por un mismo trabajo o por un trabajo de igual valor.",
        "Impulsar la guerra de género en los pagos a fin de mes."
      ],
      correct: 1
    },
    {
      id:5,
      text: "¿Cuál de las siguientes opciones corresponden a los beneficios de la igualdad?",
      options:[
        "Economía Fuerte - Paz y Salud.",
        "Mayor Feminismo - Menos Machismo.",
        "Economía Débil - Labores suaves para las mujeres."
      ],
      correct: 0
    },
    {
      id:6,
      text: "¿En qué consiste la Presión Social Laboral?",
      options:[
        "Aislamiento deliberado del equipo.",
        "Comentarios con insinuaciones sexuales",
        "Difusión de rumores falsos"
      ],
      correct: 0
    },
    {
      id:7,
      text: "¿Cuál de las siguientes opciones se puede considerar como: Principios de Inclusión?",
      options:[
        "Contratación por méritos profesionales.",
        "Descriminar a un compañero por edad o discapacidad.",
        "Contratar a un trabajador porque bebe cada semana."
      ],
      correct: 0
    },
    {
      id:8,
      text: "Selecciona: ¿Cuáles consideras que son los canales de denuncias ante algún falta de respeto, discriminación o No Inclusión?",
      options:[
        "El portero - El señor que recoge la basura.",
        "La página oficial de la empresa en Facebook - Un mensaje de texto por TikTok.",
        "Linea telefónica confidencial - Oficina de Talento Humano."
      ],
      correct: 2
    },
    {
      id:9,
      text: "Consideras qué: ¿Encargar organización o tareas de apoyo a mujeres asumiendo que son más ordenadas, es una asignaciòn de rol por género?",
      options:[
        "Sí",
        "No"
      ],
      correct: 0
    },
    {
      id:10,
      text: "¿Qué implica la correspondencia familiar?",
      options: [
        "Mayor satisfacción laboral.",
        "Hombres y mujeres comparten roles domésticos.",
        "Reingreso al trabajo sin penalizaciones."
      ],
      correct:1
    }
  ];

  const [answers, setAnswers] = useState({});
  const [resultado, setResultado] = useState(null);

  const handleSelect = (qid, idx) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const calcularPuntaje = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) score++;
    });
    return Math.round((score / questions.length) * 100);
  };

  // GUARDAR RESULTADOS
  const guardarResultados = async (puntaje, aprobado) => {
    const usuario = localStorage.getItem("usuario");
    const fecha = new Date().toISOString().split("T")[0];

    await fetch(`${API_URL}/api/resultados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: usuario,
        puntaje,
        aprobado,
        proceso: "Talento Humano",
        fecha_registro: fecha,
      }),
    });
  };

  // ENVIAR PRUEBA - MODIFICADO
  const handleSubmit = async () => {
    const puntaje = calcularPuntaje();

    if (Object.keys(answers).length !== questions.length) {
      alert("Responde todas las preguntas.");
      return;
    }

    const aprobado = puntaje >= 70;

    await guardarResultados(puntaje, aprobado);
    
    // Establecemos que estamos mostrando un resultado
    setMostrandoResultado(true);
    
    if (aprobado) {
      setResultado("aprobado");
    } else {
      setResultado("reprobado");
    }
    
    // Llamamos a finalizarPrueba para actualizar BD
    await finalizarPrueba(aprobado);
  };

  // MODIFICADO: Solo mostrar "Ya aprobado" si no estamos mostrando un resultado
  if (yaAprobado && !mostrandoResultado && !resultado) {
    return (
      <div className="container py-5">
        <div className="alert alert-success text-center">
          <i className="bi bi-check-circle-fill me-2"></i>
          Ya aprobaste la prueba final anteriormente.
        </div>
        <button 
          className="btn btn-primary mt-3" 
          onClick={() => navigate("/courses")}
        >
          Volver a los cursos
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container py-5">
      <h2 className="quiz-title">Prueba Final</h2>

      {resultado === null && (
        <form>
          {questions.map((q) => (
            <div key={q.id} className="quiz-question mb-4">
              <h5>{q.text}</h5>

              {q.options.map((op, idx) => (
                <label className="quiz-option" key={idx}>
                  <input
                    type="radio"
                    checked={answers[q.id] === idx}
                    onChange={() => handleSelect(q.id, idx)}
                  />
                  {op}
                </label>
              ))}
            </div>
          ))}

          <button 
            type="button" 
            onClick={handleSubmit} 
            className="btn-submit"
          >
            Enviar respuestas
          </button>
        </form>
      )}

      {resultado === "aprobado" && (
        <div className="alert alert-success text-center mt-4">
          <h4 className="mb-3">
            <i className="bi bi-trophy-fill me-2"></i>
            ¡Felicidades!
          </h4>
          <p className="mb-3">
            Aprobaste la prueba final con una calificación de: 
            <strong className="ms-1">{calcularPuntaje()}%</strong>
          </p>
          <button 
            onClick={() => navigate("/courses")} 
            className="btn btn-primary mt-3"
          >
            Volver a los cursos
          </button>
        </div>
      )}

      {resultado === "reprobado" && (
        <div className="alert alert-danger text-center mt-4">
          <div className="reprobado-content">
            <div className="reprobado-message mb-4">
              <i className="bi bi-x-circle-fill text-danger me-2"></i>
              No alcanzaste el 70%. Obtuviste <strong>{calcularPuntaje()}%</strong>
            </div>
            <button
              className="btn btn-warning btn-lg"
              onClick={() => {
                setAnswers({});
                setResultado(null);
                setMostrandoResultado(false);
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
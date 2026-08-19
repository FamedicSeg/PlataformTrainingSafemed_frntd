import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/pages/adminProceso.css"

export default function AdminDireccion() {
  const [resultados, setResultados] = useState([]);
  const [resultadosCompletos, setResultadosCompletos] = useState([]); // 🆕 Para guardar todos los datos
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const proceso = "Dirección";

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/resultados/${encodeURIComponent(proceso)}`
        );

        if (!res.ok) {
          console.error("Respuesta no OK:", res.status);
          setResultados([]);
          setResultadosCompletos([]);
          return;
        }

        const data = await res.json();
        
        // Guardar todos los datos para el Excel
        setResultadosCompletos(data);
        
        // Filtrar para mostrar solo un registro por persona (el último aprobado o el último intento)
        const resultadosUnicos = obtenerResultadosUnicos(data);
        setResultados(resultadosUnicos);
        
      } catch (error) {
        console.error("Error cargando resultados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResultados();
  }, []);

  // FUNCIÓN PARA OBTENER SOLO UN REGISTRO POR PERSONA
  const obtenerResultadosUnicos = (data) => {
    if (!data || data.length === 0) return [];
    
    const personasUnicas = {};
    const intentosPorPersona = {};
    
    // Contar intentos y agrupar por persona
    data.forEach(record => {
      const clave = record.nombre;
      
      // Contar intentos
      if (!intentosPorPersona[clave]) {
        intentosPorPersona[clave] = 0;
      }
      intentosPorPersona[clave]++;
      
      // Seleccionar el mejor registro para mostrar (último aprobado o último intento)
      if (!personasUnicas[clave]) {
        personasUnicas[clave] = record;
      } else {
        // Preferir registros aprobados, o el más reciente
        const actual = personasUnicas[clave];
        if (record.aprobado && !actual.aprobado) {
          personasUnicas[clave] = record;
        } else if (record.fecha_registro > actual.fecha_registro) {
          personasUnicas[clave] = record;
        }
      }
    });

    console.log("🔍 Personas únicas:", Object.keys(personasUnicas).length);
    console.log("🔍 Intentos por persona:", intentosPorPersona);

    // Convertir a array y agregar el contador de intentos
    return Object.values(personasUnicas).map(record => ({
      ...record,
      intentos: intentosPorPersona[record.nombre] || 1
    }));
  };


  // FUNCIÓN PARA GENERAR EL CERTIFICADO
  const generateCertificate = (record) => {
    const doc = new jsPDF({ orientation: "landscape"})
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // 🎨 Colores
    const azulFondo1 = "#0d2d3e";
    const azulFondo2 = "#00b8c6";
    const dorado = "#00b8c6";
    const line = "#146781";

    doc.setFillColor(azulFondo2);
    doc.triangle(
      0, h,     // punto izquierdo
      w * 0.40, h, // punto superior diagonal
      0, h * 0.5,     // punto inferior diagonal
      "F"
    );

    doc.setFillColor(azulFondo1);
    doc.triangle(
      0, 0,       // punto superior izquierdo
      w * 0.28, 0,  // punto superior derecho de la franja
      0, h,        // punto inferior izquierdo
      "F"
    );

    // MEDALLA DORADA
    doc.setFillColor(dorado);
    doc.circle(w * 0.11, h * 0.17, 18, "F");

    // TÍTULOS
    const logoURL = "/img/safemedic.png";
    doc.addImage(logoURL, "PNG", w - 85, 5, 75, 25);
    doc.setFont("helvetica", "bold", "sans-serif");
    doc.setFontSize(70);
    doc.setTextColor("#D4AF37");
    doc.text("CERTIFICADO", w / 2 + 40, 65, { align: "center" });

    // OTORGADO A
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor("#444444");
    doc.text("Otorgado a", w / 2 + 40, 80, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(35);
    doc.setTextColor("#000000");
    doc.text(record.nombre, w / 2 + 30, 95, { align: "center" });

    // TEXTO
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor("#000000ff");
    doc.text(
      "Por haber participado con éxito en la capacitación que abarca los siguientes temas:",
      w / 2 + 35,
      105,
      { align: "center" }
    );

    doc.setFontSize(12);
    doc.text("• Derechos laborales de hombres y mujeres", w / 2 + 40, 115, { align: "center" });
    doc.text("• Igualdad de género", w / 2 + 18, 125, { align: "center" });
    doc.text(
      "• Erradicación de la violencia y no discriminación",
      w / 2 + 44,
      135,
      { align: "center" }
    );
    doc.text(
      "• Otros relacionados para establecer el trabajo de igual valor",
      w / 2 + 55,
      145,
      { align: "center" }
    );

    // FECHA
    const _fecha = record.fecha_registro
      ? new Date(record.fecha_registro).toLocaleDateString("es-EC")
      : new Date().toLocaleDateString("es-EC");

    doc.setFontSize(15);
    doc.setTextColor("#000000");
    doc.text("Fecha: Noviembre 2025", w / 2 + 105, 155, { align: "center" });
    doc.text("Duración: 40 horas", w / 2 - 35, 155, {align: "center"});

    // FIRMAS
    doc.setDrawColor(line);
    doc.setLineWidth(0.8);

    doc.line(w / 2 + 0, h - 25, w / 2 + 85, h - 25);

    const firmaURL = "/img/firma.png";
    doc.addImage(firmaURL, "PNG", w /2 + 10, h - 58, 65, 32);
    doc.setFont("times", "italic");
    doc.text("Abigail Cisneros", w / 2 + 40, h - 15, { align: "center" });
    doc.setFont("times", "italic");
    doc.text("JEFE DE TALENTO HUMANO", w / 2 + 40, h - 7, { align: "center" });

    doc.save(`Certificado_${record.nombre}.pdf`);
  };

  //   EXPORTAR A EXCEL
  const exportToExcel = () => {
    // 🆕 Usar resultadosCompletos para exportar TODOS los intentos
    if (resultadosCompletos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // INCLUIR TODOS LOS INTENTOS EN EL EXCEL
    const dataForExcel = resultadosCompletos.map(item => ({
      "Nombre": item.nombre,
      "Puntaje": `${item.puntaje}%`,
      "Estado": item.aprobado ? "Aprobado" : "Reprobado",
      "Fecha Registro": item.fecha_registro ? 
        new Date(item.fecha_registro).toLocaleDateString('es-EC') : 
        'N/A',
      "Proceso": item.proceso
    }));

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados Proceso: Dirección");
    
    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Descargar archivo
    saveAs(data, `Resultados_Talento_Humano_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container py-5">
      <div className="header-section">
        <h2 className="fw-bold text-primary text-center mb-4">
          RESULTADOS
        </h2>
        <h2 className="fw-bold text-primary text-center mb-4">
          Proceso: Dirección
        </h2>
        
        {/* Botón Exportar a Excel */}
        {!loading && resultados.length > 0 && (
          <div className="export-button-container">
            <button 
              className="btn btn-success export-excel-btn"
              onClick={exportToExcel}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Exportar a Excel
            </button>
          </div>
        )}
      </div>

      {loading && <p className="text-center">Cargando resultados...</p>}

      {!loading && resultados.length === 0 && (
        <div className="alert alert-warning text-center">
          No hay resultados registrados para este proceso.
        </div>
      )}

      {!loading && resultados.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Puntaje</th>
                <th>Aprobado</th>
                <th>Intentos</th>
                <th>Fecha</th>
                <th>Proceso</th>
                <th>Certificado</th> 
              </tr>
            </thead>

            <tbody>
              {resultados.map((item) => (
                <tr key={item.id || item.nombre}>
                  <td>{item.nombre}</td>
                  <td>{item.puntaje}%</td>
                  <td>
                    {item.aprobado ? (
                      <span className="badge bg-success">Aprobado</span>
                    ) : (
                      <span className="badge bg-danger">Reprobado</span>
                    )}
                  </td>
                  <td>
                    {/* MOSTRAR INTENTOS CON COLORES SEGÚN CANTIDAD */}
                    <span className={
                      item.intentos === 1 ? "text-success fw-bold" :
                      item.intentos === 2 ? "text-warning fw-bold" :
                      "text-danger fw-bold"
                    }>
                      {item.intentos} {item.intentos === 1 ? "intento" : "intentos"}
                    </span>
                  </td>
                  <td>
                    {item.fecha_registro ? 
                      new Date(item.fecha_registro).toLocaleDateString('es-EC') : 
                      'N/A'
                    }
                  </td>
                  <td>{item.proceso}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => generateCertificate(item)}
                      disabled={!item.aprobado}
                    >
                      Generar certificado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
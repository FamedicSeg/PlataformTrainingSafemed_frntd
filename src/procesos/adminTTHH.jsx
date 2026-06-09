import { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/pages/adminProceso.css";

export default function AdminTalentoHumano() {
  const [resultados, setResultados] = useState([]);
  const [resultadosCompletos, setResultadosCompletos] = useState([]);
  const [documentos, setDocumentos] = useState([]); 
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true); 
  const [loading, setLoading] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState("resultados"); 
  const [filtroDocumentos, setFiltroDocumentos] = useState("");
  
  const API_URL = import.meta.env.VITE_API_URL;
  const proceso = "Talento Humano";
  const tablaRef = useRef(null);

  // Cargar resultados
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
        setResultadosCompletos(data);
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

  // 🆕 Cargar documentos de conformidad
  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/documentos/todos`);
        if (res.ok) {
          const data = await res.json();
          setDocumentos(data);
        } else {
          console.error("Error cargando documentos");
        }
      } catch (error) {
        console.error("Error cargando documentos:", error);
      } finally {
        setCargandoDocumentos(false);
      }
    };

    fetchDocumentos();
  }, []);

  // Scroll de tabla
  useEffect(() => {
    if (!loading && tablaRef.current) {
      tablaRef.current.scrollLeft = 0;
      requestAnimationFrame(() => {
        if (tablaRef.current) tablaRef.current.scrollLeft = 0;
      });
      const t = setTimeout(() => {
        if (tablaRef.current) tablaRef.current.scrollLeft = 0;
      }, 150);
      return () => clearTimeout(t);
    }
  }, [loading, resultados]);

  const obtenerResultadosUnicos = (data) => {
    if (!data || data.length === 0) return [];

    const personasUnicas = {};
    const intentosPorPersona = {};

    data.forEach(record => {
      const clave = record.nombre;
      if (!intentosPorPersona[clave]) {
        intentosPorPersona[clave] = 0;
      }
      intentosPorPersona[clave]++;

      if (!personasUnicas[clave]) {
        personasUnicas[clave] = record;
      } else {
        const actual = personasUnicas[clave];
        if (record.aprobado && !actual.aprobado) {
          personasUnicas[clave] = record;
        } else if (record.fecha_registro > actual.fecha_registro) {
          personasUnicas[clave] = record;
        }
      }
    });

    return Object.values(personasUnicas).map(record => ({
      ...record,
      intentos: intentosPorPersona[record.nombre] || 1
    }));
  };

  const imprimirDocumento = (doc) => {
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
            .seccion { margin: 30px 0; }
            .titulo-seccion { background: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 15px; }
            .campo { margin: 10px 0; }
            .label { font-weight: bold; display: inline-block; min-width: 180px; }
            .firma { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 14px;}
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
            .logo-img { max-width: 680px; margin-bottom: 20px; display: block; margin-left: 0; margin-right: 0; text-align: center; }
          </style>
        </head>
        <body>
         <!-- LOGO EN LA PARTE SUPERIOR -->
          <div class="header-logo">
            <img src="/img/imagen6.png" alt="imagen6" class="logo-img" onerror="this.style.display='none'">
          </div>
          <br></br>
          <h1>RECIBO CONFORME</h1>
          <p>Acepto conforme la recepción del <strong>Reglamento Interno de Trabajo, Código de Ética y la Política de Responsabilidad Social de la Compañía Limitada Famedic.</strong></p>
          <p>Reconozco haber sido notificado de que debo leer, conocer, entender y cumplir con los artículos contenidos en dichos documentos.</p>
          <p>Me comprometo a cumplir fielmente lo dispuesto en el <strong>Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social.</strong> 
          Entiendo que el obrar en contra de estos por acción u omisión, suministrará suficiente base para aplicar las sanciones correspondientes o dar por terminado mi contrato de trabajo.</p>
          
          <div class="seccion">
            <div class="titulo-seccion">DATOS DEL COLABORADOR</div>
            <div class="campo"><span class="label">Apellidos y Nombres:</span> ${doc.apellidos_nombres}</div>
            <div class="campo"><span class="label">C.I./ Pasaporte:</span> ${doc.cedula_identidad}</div>
            <div class="campo"><span class="label">Proceso:</span> ${doc.proceso || "N/A"}</div>
            <div class="campo"><span class="label">Cargo:</span> ${doc.cargo || "N/A"}</div>
            <div class="campo"><span class="label">Fecha de Recepción:</span> ${new Date(doc.fecha_recepcion).toLocaleDateString()}</div>
          </div>
          
          <div class="seccion">
            <div class="titulo-seccion">INFORMACIÓN DEL CURSO</div>
            <div class="campo"><span class="label">Curso:</span> ${doc.curso}</div>
            <div class="campo"><span class="label">Usuario del sistema:</span> ${doc.usuario}</div>
            <div class="campo"><span class="label">Fecha de envío:</span> ${new Date(doc.fecha_envio).toLocaleString()}</div>
          </div>
          
          <div class="firma">
            <p><strong>Entregado por:</strong> ABIGAIL CISNEROS</p>
            <p><strong>Cargo:</strong> JEFA DE TALENTO HUMANO</p>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const exportarDocumentosCSV = () => {
    if (documentos.length === 0) {
      alert("No hay documentos para exportar");
      return;
    }

    const headers = ["ID", "Usuario", "Cédula", "Nombre Completo", "Curso", "Proceso", "Cargo", "Fecha Recepción", "Fecha Envío"];
    const rows = documentos.map(doc => [
      doc.id,
      doc.usuario,
      doc.cedula_identidad,
      doc.apellidos_nombres,
      doc.curso,
      doc.proceso || "N/A",
      doc.cargo || "N/A",
      new Date(doc.fecha_recepcion).toLocaleDateString(),
      new Date(doc.fecha_envio).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documentos_conformidad_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCertificate = (record) => {
    const doc = new jsPDF({ orientation: "landscape" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    const azulFondo1 = "#0d2d3e";
    const azulFondo2 = "#00b8c6";
    const dorado = "#00b8c6";
    const line = "#146781";

    doc.setFillColor(azulFondo2);
    doc.triangle(0, h, w * 0.40, h, 0, h * 0.5, "F");

    doc.setFillColor(azulFondo1);
    doc.triangle(0, 0, w * 0.28, 0, 0, h, "F");

    doc.setFillColor(dorado);
    doc.circle(w * 0.11, h * 0.17, 18, "F");

    const logoURL = "/img/safemedic.png";
    doc.addImage(logoURL, "PNG", w - 85, 5, 75, 25);
    doc.setFont("helvetica", "bold", "sans-serif");
    doc.setFontSize(70);
    doc.setTextColor("#D4AF37");
    doc.text("CERTIFICADO", w / 2 + 40, 65, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor("#444444");
    doc.text("Otorgado a", w / 2 + 40, 80, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(35);
    doc.setTextColor("#000000");
    doc.text(record.nombre, w / 2 + 30, 95, { align: "center" });

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
    doc.text("• Erradicación de la violencia y no discriminación", w / 2 + 44, 135, { align: "center" });
    doc.text("• Otros relacionados para establecer el trabajo de igual valor", w / 2 + 55, 145, { align: "center" });

    doc.setFontSize(15);
    doc.setTextColor("#000000");
    doc.text("Fecha: Noviembre 2025", w / 2 + 105, 155, { align: "center" });
    doc.text("Duración: 40 horas", w / 2 - 35, 155, { align: "center" });

    doc.setDrawColor(line);
    doc.setLineWidth(0.8);
    doc.line(w / 2 + 0, h - 25, w / 2 + 85, h - 25);

    const firmaURL = "/img/firma.png";
    doc.addImage(firmaURL, "PNG", w / 2 + 10, h - 58, 65, 32);
    doc.setFont("times", "italic");
    doc.text("Abigail Cisneros", w / 2 + 40, h - 15, { align: "center" });
    doc.setFont("times", "italic");
    doc.text("JEFE DE TALENTO HUMANO", w / 2 + 40, h - 7, { align: "center" });

    doc.save(`Certificado_${record.nombre}.pdf`);
  };

  const exportToExcel = () => {
    if (resultadosCompletos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const dataForExcel = resultadosCompletos.map(item => ({
      "Nombre": item.nombre,
      "Puntaje": `${item.puntaje}%`,
      "Estado": item.aprobado ? "Aprobado" : "Reprobado",
      "Fecha Registro": item.fecha_registro
        ? new Date(item.fecha_registro).toLocaleDateString('es-EC')
        : 'N/A',
      "Proceso": item.proceso
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados Talento Humano");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(data, `Resultados_Talento_Humano_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtrar documentos
  const documentosFiltrados = documentos.filter(doc => 
    doc.apellidos_nombres.toLowerCase().includes(filtroDocumentos.toLowerCase()) ||
    doc.cedula_identidad.includes(filtroDocumentos) ||
    doc.usuario.toLowerCase().includes(filtroDocumentos.toLowerCase())
  );

  return (
    <div className="container py-5">
      {/* 🆕 Pestañas */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            className={`btn ${pestanaActiva === "resultados" ? "btn-primary" : "btn-outline-primary"} px-4 py-2`}
            onClick={() => setPestanaActiva("resultados")}
          >
            📊 Resultados de Cursos
          </button>
          <button
            className={`btn ${pestanaActiva === "documentos" ? "btn-primary" : "btn-outline-primary"} px-4 py-2`}
            onClick={() => setPestanaActiva("documentos")}
          >
            📄 Documentos de Conformidad
            {documentos.length > 0 && (
              <span className="ms-2 badge bg-white text-primary">{documentos.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* SECCIÓN DE RESULTADOS */}
      {pestanaActiva === "resultados" && (
        <>
          <div className="header-section">
            <h2 className="fw-bold text-primary text-center mb-4">
              RESULTADOS - Talento Humano
            </h2>

            {!loading && resultados.length > 0 && (
              <div className="export-button-container text-end mb-3">
                <button className="btn btn-success" onClick={exportToExcel}>
                  <i className="bi bi-file-earmark-excel"></i> Exportar a Excel
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
            <div ref={tablaRef} className="table-responsive tabla-mobile">
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
                        <span className={
                          item.intentos === 1 ? "text-success fw-bold" :
                          item.intentos === 2 ? "text-warning fw-bold" :
                          "text-danger fw-bold"
                        }>
                          {item.intentos} {item.intentos === 1 ? "intento" : "intentos"}
                        </span>
                      </td>
                      <td>
                        {item.fecha_registro
                          ? new Date(item.fecha_registro).toLocaleDateString('es-EC')
                          : 'N/A'}
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
        </>
      )}

      {/* 🆕 SECCIÓN DE DOCUMENTOS DE CONFORMIDAD */}
      {pestanaActiva === "documentos" && (
        <>
          <div className="header-section">
            <h2 className="fw-bold text-primary text-center mb-4">
              📄 DOCUMENTOS DE CONFORMIDAD
            </h2>
            <p className="text-center text-muted mb-3">
              Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social
            </p>

            {!cargandoDocumentos && documentos.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="flex-grow-1 me-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Buscar por nombre, cédula o usuario..."
                    value={filtroDocumentos}
                    onChange={(e) => setFiltroDocumentos(e.target.value)}
                  />
                </div>
                <button className="btn btn-success" onClick={exportarDocumentosCSV}>
                  📥 Exportar todos a CSV
                </button>
              </div>
            )}
          </div>

          {cargandoDocumentos && (
            <p className="text-center">Cargando documentos...</p>
          )}

          {!cargandoDocumentos && documentosFiltrados.length === 0 && (
            <div className="alert alert-info text-center">
              {filtroDocumentos ? "No se encontraron documentos con ese filtro" : "No hay documentos de conformidad registrados"}
            </div>
          )}

          {!cargandoDocumentos && documentosFiltrados.length > 0 && (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Curso</th>
                    <th>Proceso</th>
                    <th>Cargo</th>
                    <th>Fecha Recepción</th>
                    <th>Fecha Envío</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documentosFiltrados.map(doc => (
                    <tr key={doc.id}>
                      <td>{doc.cedula_identidad}</td>
                      <td>{doc.apellidos_nombres}</td>
                      <td>{doc.curso}</td>
                      <td>{doc.proceso || "N/A"}</td>
                      <td>{doc.cargo || "N/A"}</td>
                      <td>{new Date(doc.fecha_recepcion).toLocaleDateString()}</td>
                      <td>{new Date(doc.fecha_envio).toLocaleString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary mb-1"
                          onClick={() => imprimirDocumento(doc)}
                          title="Ver/Imprimir"
                        >
                          🖨️ Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
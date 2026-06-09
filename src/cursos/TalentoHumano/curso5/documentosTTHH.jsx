import { useState, useEffect } from "react";

export default function DocumentosTalentoHumano() {
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documentos/todos`);
      const data = await res.json();
      setDocumentos(data);
    } catch (error) {
      console.error("Error cargando documentos:", error);
      alert("Error al cargar los documentos");
    } finally {
      setCargando(false);
    }
  };

  const descargarTXT = (doc) => {
    const contenido = `RECIBO CONFORME

Acepto conforme la recepción del Reglamento Interno de Trabajo, Código de Ética y la Política de Responsabilidad Social.

Reconozco haber sido notificado de que debo leer, conocer, entender y cumplir con los artículos contenidos en dichos documentos.

Me comprometo a cumplir fielmente lo dispuesto en el Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social. Entiendo que el obrar en contra de estos por acción u omisión, suministrará suficiente base para aplicar las sanciones correspondientes o dar por terminado mi contrato de trabajo.

===========================================
DATOS DEL COLABORADOR
===========================================
Apellidos y Nombres: ${doc.apellidos_nombres}
C.I./ Pasaporte: ${doc.cedula_identidad}
Proceso: ${doc.proceso || "N/A"}
Cargo: ${doc.cargo || "N/A"}
Fecha de Recepción: ${new Date(doc.fecha_recepcion).toLocaleDateString()}

===========================================
INFORMACIÓN DEL CURSO
===========================================
Curso: ${doc.curso}
Usuario del sistema: ${doc.usuario}
Fecha de envío: ${new Date(doc.fecha_envio).toLocaleString()}

===========================================
ENTREGADO POR
===========================================
Entregado por: ABIGAIL CISNEROS
Cargo: JEFA DE TALENTO HUMANO

--- Documento generado automáticamente ---
    `;
    
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documento_${doc.apellidos_nombres.replace(/\s/g, "_")}_${doc.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const descargarCSV = () => {
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

  const imprimirDocumento = (doc) => {
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>Documento Conformidad - ${doc.apellidos_nombres}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
            .seccion { margin: 30px 0; }
            .titulo-seccion { background: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 15px; }
            .campo { margin: 10px 0; }
            .label { font-weight: bold; display: inline-block; min-width: 180px; }
            .firma { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <h1>RECIBO CONFORME</h1>
          
          <p>Acepto conforme la recepción del <strong>Reglamento Interno de Trabajo, Código de Ética y la Política de Responsabilidad Social.</strong></p>
          
          <p>Reconozco haber sido notificado de que debo leer, conocer, entender y cumplir con los artículos contenidos en dichos documentos.</p>
          
          <p>Me comprometo a cumplir fielmente lo dispuesto en el <strong>Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social.</strong> Entiendo que el obrar en contra de estos por acción u omisión, suministrará suficiente base para aplicar las sanciones correspondientes o dar por terminado mi contrato de trabajo.</p>
          
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
          
          <div class="footer">
            Documento generado automáticamente - ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const documentosFiltrados = documentos.filter(doc => 
    doc.apellidos_nombres.toLowerCase().includes(filtro.toLowerCase()) ||
    doc.cedula_identidad.includes(filtro) ||
    doc.usuario.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return (
      <div className="text-center mt-5 pt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando documentos...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 pt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h2 className="mb-0">📄 Documentos de Conformidad</h2>
          <p className="text-muted">Reglamento Interno de Trabajo, Código de Ética y Política de Responsabilidad Social</p>
        </div>
        <button className="btn btn-success" onClick={descargarCSV}>
          📥 Exportar todos a CSV
        </button>
      </div>

      {/* Filtro */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Buscar por nombre, cédula o usuario..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <div className="col-md-6 text-end">
              <span className="badge bg-primary fs-6 p-2">
                Total: {documentosFiltrados.length} documentos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de documentos */}
      {documentosFiltrados.length === 0 ? (
        <div className="alert alert-info text-center">
          <i className="bi bi-info-circle fs-1"></i>
          <p className="mt-2">No hay documentos registrados</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Usuario</th>
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
                  <td>{doc.id}</td>
                  <td>{doc.usuario}</td>
                  <td>{doc.cedula_identidad}</td>
                  <td>{doc.apellidos_nombres}</td>
                  <td>{doc.curso}</td>
                  <td>{doc.proceso || "N/A"}</td>
                  <td>{doc.cargo || "N/A"}</td>
                  <td>{new Date(doc.fecha_recepcion).toLocaleDateString()}</td>
                  <td>{new Date(doc.fecha_envio).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary me-1 mb-1"
                      onClick={() => descargarTXT(doc)}
                      title="Descargar TXT"
                    >
                      📄 TXT
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary me-1 mb-1"
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
    </div>
  );
}
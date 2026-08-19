import { useState, useEffect } from "react";
import '../styles/components/documentoTTHH.css';

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

  const imprimirDocumento = async (doc) => {
    const ventana = window.open("","");
    ventana.document.write(`
      <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto; 
              text-align: justify; 
            }
            
            h1 { 
              text-align: center; 
              color: #000000; 
              padding-bottom: 10px; 
              margin-bottom: 30px;
            }
            
            p {
              margin-bottom: 15px;
              line-height: 1.5;
              font-size: 12px;
            }
            
            .seccion { 
              margin: 30px 0; 
            }
            
            .titulo-seccion { 
              background: #f0f0f0; 
              padding: 10px; 
              font-weight: bold; 
              margin-bottom: 15px; 
              font-size: 16px;
            }
            
            .campo { 
              margin: 10px 0; 
              font-size: 12px;
            }
            
            .label { 
              font-weight: bold; 
              display: inline-block; 
              min-width: 180px; 
            }
            
            .footer { 
              margin-top: 50px; 
              font-size: 12px; 
              color: #666; 
              text-align: center; 
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }

             /* ESTILOS PARA EL CUADRO SUPERIOR DIVIDIDO EN 3 PARTES */
              .cuadro-superior{
                display: flex;
                border: 1px solid #000000;
                padding: 5px:;
                margin-bottom: 30px;
                border-radius: 0px;
                overflow: hidden;
              }

              .cuadro-superior .parte-izquierda{
                flex: 0 0 12px;
                padding: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-right: 1px solid #000000;
                background-color: #fff;
              }
              
              .cuadro-superior .parte-izquierda img{
                max-width: 210px;
                max-height: 60px;
                object-fit: contain;
              }
              
              .cuadro-superior .parte-central{
                flex: 1;
                padding: 15px;
                text-align: center;
                font-weight: bold;
                border-right: 1px solid #000000;
              }

              .cuadro-superior .parte-central .titulo-documento{
                font-size: 14px;
                font-family: Calibri, sans-serif;
                font-weight: bold;
                color: #000000;
                margin-bottom: 5px;
              }

              .cuadro-superior .parte-derecha{
                flex: 0 0 180px;
                padding: 15px;
                text-align: right;
                font-size: 12px;
                color: #000000;
                line-height: 1.6;
              }
              
              .cuadro-superior .parte-derecha .info-label{
                font-weight: bold;
                color: #000000;
                text-align: left;
                font-size: 12px;
                font-family: Calibri, sans-serif;
                display: inline-block;
                max-width: 65px;
              }

              .cuadro-superior .parte-derecha .texto-sub{
                font-size: 12px;
                font-family: Calibri, sans-serif;
                color: #000000;
                margin-bottom: 3px;
                text-align: left;
                display: block;
              }
            
            /* ESTILOS PARA PANTALLA */
            .firma { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-top: 50px;
              margin-bottom: 30px;
              width: 100%;
            }
            
            .firma-nombre { 
              margin: 0; 
              text-align: left; 
              font-size: 12px; 
            }
            
            .firma-cargo { 
              margin: 0; 
              text-align: right; 
              font-size: 12px; 
            }
            
            /* ESTILOS ESPECÍFICOS PARA IMPRESIÓN (Ctrl+P) */
            @media print {
              body {
                padding: 20px;
                margin: 0;
              }
              
              .firma {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                width: 100% !important;
                margin-top: 50px !important;
                margin-bottom: 30px !important;
                page-break-inside: avoid !important;
              }
              
              .firma-nombre {
                text-align: left !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .firma-cargo {
                text-align: right !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .titulo-seccion {
                background: #f0f0f0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .seccion {
                page-break-inside: avoid !important;
              }
              
            }
          </style>
        </head>
        <body>
          <!-- CUADRO SUPERIOR DIVIDIDO EN 3 PARTES -->
          <div class="cuadro-superior">
            <div class="parte-izquierda">
              <img src="/img/safemedic.png" alt="Logo SafeMedic">
            </div>
            <div class="parte-central">
              <div class="titulo-documento">CONSTANCIA DE ENTREGA: REGLAMENTO INTERNO DE TRABAJO - CÓDIGO DE ÉTICA - POLÍTICA DE RESPONSABILIDAD SOCIAL</div>
            </div>
            <div class="parte-derecha">
              <div class="texto-sub"><span class="info-label">CÓDIGO: </span> RG-GTH-12</div>
              <div class="texto-sub"><span class="info-label">FECHA: </span> 04-02-2025</div>
              <div class="texto-sub"><span class="info-label">VERSIÓN: </span> 03</div>
            </div>
          </div>

          <h1>RECIBO CONFORME</h1>
          
          <p>Acepto conforme la recepción del <strong>Reglamento Interno de Trabajo, Código de Ética y la Política de Responsabilidad Social de la Compañía Limitada Famedic.</strong></p>
          
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
            <p class="firma-nombre"><strong>Entregado por:</strong> ABIGAIL CISNEROS</p>
            <p class="firma-cargo"><strong>Cargo:</strong> JEFE DE TALENTO HUMANO</p>
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
          <h2 className="mb-0" style={{padding: "10px"}}>Documentos de Conformidad</h2>
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
                <th className="col-usuario">Usuario</th>
                <th className="col-cedula">Cédula</th>
                <th className="col-curso">Curso</th>
                <th className="col-proceso">Proceso</th>
                <th className="col-cargo">Cargo</th>
                <th className="col-fecha-recepcion">F. Recepción</th>
                <th className="col-fecha-envio">F. Envío</th>
                <th className="col-acciones">Acción</th>
              </tr>
            </thead>
            <tbody>
              {documentosFiltrados.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.usuario}</td>
                  <td>{doc.cedula_identidad}</td>
                  <td>{doc.curso}</td>
                  <td>{doc.proceso || "N/A"}</td>
                  <td>{doc.cargo || "N/A"}</td>
                  <td>{new Date(doc.fecha_recepcion).toLocaleDateString()}</td>
                  <td>{new Date(doc.fecha_envio).toLocaleString()}</td>
                  <td>
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
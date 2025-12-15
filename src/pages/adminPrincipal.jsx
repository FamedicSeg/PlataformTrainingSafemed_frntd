import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Admin() {
  const API_URL = import.meta.env.VITE_API_URL;
  const URL = `${API_URL}/results`; 

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde backend
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(URL);
        const data = await res.json();
        setSubmissions(data);
      } catch (error) {
        console.error("❌ Error al obtener datos del backend:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Agrupar intentos por persona
  const grouped = submissions.reduce((acc, curr) => {
    if (!curr.nombre) return acc;
    if (!acc[curr.nombre]) acc[curr.nombre] = [];
    acc[curr.nombre].push(curr);
    return acc;
  }, {});

  const total = submissions.length;
  const passed = submissions.filter((s) => s.aprobado).length;
  const failed = total - passed;

  // Generar certificado
  const generateCertificate = (record) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // === COLORES ===
  const azulOscuro = "#00334e";
  const azulMedio = "#007c8a";
  const aqua = "#00b3b3";

  // === FONDO CON FORMAS (imitación del certificado) ===
  doc.setFillColor(azulOscuro);
  doc.rect(0, 0, w, h * 0.20, "F");

  doc.setFillColor(aqua);
  doc.rect(0, h * 0.18, w, 15, "F");

  // Capa decorativa inferior
  doc.setFillColor(azulMedio);
  doc.rect(0, h - 40, w, 40, "F");

  // === CABECERA ===
  doc.setTextColor("#00334e");
  doc.setFontSize(16);
  doc.text("COMPAÑÍA LIMITADA FAMEDIC", w / 2, 30, { align: "center" });

  doc.setFontSize(40);
  doc.setTextColor("#000000");
  doc.text("CERTIFICADO", w / 2, 55, { align: "center" });

  doc.setFillColor(aqua);
  doc.rect(w / 2 - 120, 62, 240, 12, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(14);
  doc.text("DE CULMINACIÓN DE LA CAPACITACIÓN INTERNA", w / 2, 71, { align: "center" });

  // === CUERPO ===
  doc.setTextColor("#000000");
  doc.setFontSize(14);
  doc.text("Este certificado se otorga a:", w / 2, 95, { align: "center" });

  doc.setFontSize(30);
  doc.setTextColor(azulOscuro);
  doc.text(record.nombre, w / 2, 115, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor("#000000");
  doc.text(
    "Por haber completado satisfactoriamente el programa de formación correspondiente,",
    w / 2,
    135,
    { align: "center" }
  );
  doc.text(
    "demostrando competencia en los principios y prácticas establecidas.",
    w / 2,
    145,
    { align: "center" }
  );

  // === FECHA Y DURACIÓN ===
  doc.setFontSize(11);
  const fecha = record.date || new Date().toLocaleDateString();
  doc.text(`Fecha: ${fecha}`, w / 2 - 80, 165);
  doc.text(`Duración: 40 horas`, w / 2 + 50, 165);

  // === FIRMA ===
  doc.setDrawColor(0);
  doc.line(w / 2 - 60, h - 45, w / 2 + 60, h - 45);

  doc.setFontSize(14);
  doc.text("LILIANA ABIGAIL CISNEROS NOVOA", w / 2, h - 30, { align: "center" });
  doc.setFontSize(11);
  doc.text(
    "JEFE DE TALENTO HUMANO",
    w / 2,
    h - 22,
    { align: "center" }
  );

  // === GUARDAR ===
  doc.save(`Certificado_${record.nombre}.pdf`);
};

  // Exportar a Excel
  const exportToExcel = () => {
    if (submissions.length === 0) return alert("No hay datos para exportar.");

    const rows = submissions.map((r, i) => ({
      "#": i + 1,
      "Nombre completo": r.nombre,
      "Puntaje (%)": r.puntaje,
      Estado: r.aprobado ? "Aprobado" : "No aprobado",
      Fecha: r.fecha
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "Reporte_Capacitaciones.xlsx");
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-primary mb-4 text-center">🧾 Panel de Administración</h2>

      {loading ? (
        <div className="alert alert-info text-center">Cargando datos desde el servidor...</div>
      ) : (
        <>
          <div className="alert alert-info text-center mb-4">
            <strong>Total de evaluaciones realizadas:</strong> {total} •{" "}
            <strong>Aprobados:</strong> {passed} •{" "}
            <strong>No aprobados:</strong> {failed}
          </div>

          {submissions.length > 0 && (
            <div className="text-end mb-3">
              <button className="btn btn-success" onClick={exportToExcel}>
                <i className="bi bi-file-earmark-excel me-2"></i> Exportar a Excel
              </button>
            </div>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="alert alert-warning text-center">
              No se encontraron registros.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Nombre completo</th>
                    <th>Intentos</th>
                    <th>Último puntaje</th>
                    <th>Estado</th>
                    <th>Última fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([name, attempts], i) => {
                    const sorted = [...attempts].sort(
                      (a, b) => Number(b.id) - Number(a.id)
                    );
                    const last = sorted[0];
                    const approved = last.aprobado;

                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="text-start">{name}</td>
                        <td>{attempts.length}</td>
                        <td>{last.puntaje}%</td>
                        <td>
                          {approved ? (
                            <span className="badge bg-success">Aprobado</span>
                          ) : (
                            <span className="badge bg-danger">No aprobado</span>
                          )}
                        </td>
                        <td>{last.fecha}</td>
                        <td>
                          {approved ? (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => generateCertificate(last)}
                            >
                              <i className="bi bi-file-earmark-arrow-down"></i> Certificado
                            </button>
                          ) : (
                            <span className="text-muted small">Sin certificado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

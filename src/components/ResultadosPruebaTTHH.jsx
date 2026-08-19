import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ResultadosPruebaTTHH() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("admin_token");

  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos"); // todos | aprobados | reprobados

  useEffect(() => {
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/resultados/tthh/resumen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setDatos(data.data || []);
      else console.error("Error:", data.message);
    } catch (err) {
      console.error("Error cargando resultados:", err);
    } finally {
      setCargando(false);
    }
  };

  const datosFiltrados = datos.filter((r) => {
    if (filtro === "aprobados") return r.aprobado;
    if (filtro === "reprobados") return !r.aprobado;
    return true;
  });

  // EXPORTAR EXCEL con aprobados
  const exportarExcel = () => {
    const aprobados = datos.filter((r) => r.aprobado);
    const filas = aprobados.map((r) => ({
      "Nombre / Cédula": r.nombre_completo,
      "Cédula": r.cedula,
      "Cargo": r.cargo || "-",
      "Mejor Puntaje (%)": r.mejor_puntaje,
      "Total Intentos": r.total_intentos,
      "Fecha Aprobación": r.ultima_fecha
        ? new Date(r.ultima_fecha).toLocaleDateString("es-EC")
        : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aprobados");

    // Ajustar ancho de columnas
    ws["!cols"] = [
      { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
    ];

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Aprobados_Prueba_TalentoHumano_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // GENERAR CERTIFICADO PDF individual
  const generarCertificado = async (persona) => {
    // jsPDF v3 no carga URLs directamente: precargar imágenes como base64
    const toBase64 = (url) =>
      fetch(url)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );

    const [logoBase64, firmaBase64] = await Promise.all([
      toBase64("/img/safemedic.png"),
      toBase64("/img/firma.png"),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const azulFondo1 = "#0d2d3e";
    const azulFondo2 = "#00b8c6";
    const dorado = "#d4af37";
    const line = "#146781";

    doc.setFillColor(azulFondo2);
    doc.triangle(0, H, W * 0.40, H, 0, H * 0.5, "F");

    doc.setFillColor(azulFondo1);
    doc.triangle(0, 0, W * 0.28, 0, W*0, H-60, "F");

    doc.setFillColor(dorado);
    doc.circle(W * 0.08, H * 0.10, W * 0.07, "F");

    doc.addImage(logoBase64, "PNG", W - 85, 5, 75, 25);
    doc.setFont("garamond", "bold");
    doc.setFontSize(70);
    doc.setTextColor("#d4af37");
    doc.text("CERTIFICADO", W / 2 + 40, 65, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor("#444444");
    doc.text("Otorgado a", W / 2 + 40, 80, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(35);
    doc.setTextColor("#000000");
    doc.text(persona.nombre_completo, W / 2 + 30, 95, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor("#000000");
    doc.text(
      "Por haber participado con éxito en la capacitación que abarca los siguientes temas:",
      W / 2 + 35,
      105,
      { align: "center" }
    );
    doc.setFontSize(12);
    doc.text("• Derechos laborales de hombres y mujeres", W / 2 + 40, 115, { align: "center" });
    doc.text("• Igualdad de género", W / 2 + 18, 125, { align: "center" });
    doc.text("• Erradicación de la violencia y no discriminación", W / 2 + 44, 135, { align: "center" });
    doc.text("• Otros relacionados para establecer el trabajo de igual valor", W / 2 + 55, 145, { align: "center" });

    doc.setFontSize(15);
    doc.setTextColor("#000000");
    doc.text("Fecha: Agosto 2026", W / 2 + 105, 155, { align: "center" });
    doc.text("Duración: 40 horas", W / 2 - 35, 155, { align: "center" });

    doc.setDrawColor(line);
    doc.setLineWidth(0.8);
    doc.line(W / 2, H - 25, W / 2 + 85, H - 25);

    doc.addImage(firmaBase64, "PNG", W / 2 + 10, H - 58, 65, 32);
    doc.setFont("times", "italic");
    doc.text("Abigail Cisneros", W / 2 + 40, H - 15, { align: "center" });
    doc.text("JEFE DE TALENTO HUMANO", W / 2 + 40, H - 7, { align: "center" });

    doc.save(`Certificado_${persona.nombre_completo}.pdf`);
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">
          Resultados – Prueba Final Talento Humano
        </h5>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-success btn-sm" onClick={exportarExcel}>
            <i className="bi bi-file-earmark-excel me-1"></i>
            Exportar Excel (aprobados)
          </button>
          {/*<button className="btn btn-primary btn-sm" onClick={exportarTodosCertificados}>
            <i className="bi bi-file-earmark-pdf me-1"></i>
            Todos los certificados
          </button>*/}
          <button className="btn btn-outline-secondary btn-sm" onClick={cargarDatos}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="btn-group mb-3" role="group">
        {["todos", "aprobados", "reprobados"].map((f) => (
          <button
            key={f}
            type="button"
            className={`btn btn-sm ${filtro === f ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setFiltro(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "aprobados" && (
              <span className="badge bg-success ms-1">
                {datos.filter((r) => r.aprobado).length}
              </span>
            )}
            {f === "reprobados" && (
              <span className="badge bg-danger ms-1">
                {datos.filter((r) => !r.aprobado).length}
              </span>
            )}
            {f === "todos" && (
              <span className="badge bg-secondary ms-1">{datos.length}</span>
            )}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : datosFiltrados.length === 0 ? (
        <div className="alert alert-info">No hay registros para mostrar.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover table-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Cargo</th>
                <th>Mejor Puntaje</th>
                <th>Intentos</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Certificado</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((r, i) => (
                <tr key={r.usuario}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{r.nombre_completo}</td>
                  <td>{r.cedula}</td>
                  <td>{r.cargo || "-"}</td>
                  <td>
                    <span className={`badge ${r.mejor_puntaje >= 70 ? "bg-success" : "bg-danger"}`}>
                      {r.mejor_puntaje}%
                    </span>
                  </td>
                  <td className="text-center">{r.total_intentos}</td>
                  <td>
                    {r.aprobado ? (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>Aprobado
                      </span>
                    ) : (
                      <span className="badge bg-danger">
                        <i className="bi bi-x-circle me-1"></i>Reprobado
                      </span>
                    )}
                  </td>
                  <td>
                    {r.ultima_fecha
                      ? new Date(r.ultima_fecha).toLocaleDateString("es-EC")
                      : "-"}
                  </td>
                  <td>
                    {r.aprobado ? (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        title="Descargar certificado PDF"
                        onClick={() => generarCertificado(r)}
                      >
                        <i className="bi bi-file-earmark-pdf"> Descargar</i>
                      </button>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
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

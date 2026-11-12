import { useEffect, useState, useRef } from 'react';
import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp, Download, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
//import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';
import CursoDetailPanel from './CursoDetailPanel';
import '../styles/components/gerenciaDashboard.css';

export default function GerenciaDashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedProceso, setExpandedProceso] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const chartRefPastel = useRef(null);
  const chartRefBarras = useRef(null);
  const chartInstancePastel = useRef(null);
  const chartInstanceBarras = useRef(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (estadisticas && chartRefPastel.current && chartRefBarras.current) {
      generarGraficos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadisticas]);

  const generarGraficos = () => {
    if (chartInstancePastel.current) chartInstancePastel.current.destroy();
    const ctxPastel = chartRefPastel.current.getContext('2d');
    chartInstancePastel.current = new Chart(ctxPastel, {
      type: 'doughnut',
      data: {
        labels: ['Completado', 'En Progreso', 'No Iniciado'],
        datasets: [{
          data: [por_estado.completado, por_estado.en_progreso, por_estado.no_iniciado],
          backgroundColor: ['#198754', '#ffc107', '#dc3545'],
          borderColor: ['#fff', '#fff', '#fff'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } }
        }
      }
    });

    if (chartInstanceBarras.current) chartInstanceBarras.current.destroy();
    const ctxBarras = chartRefBarras.current.getContext('2d');
    chartInstanceBarras.current = new Chart(ctxBarras, {
      type: 'bar',
      data: {
        labels: procesos.map(p => p.proceso_nombre),
        datasets: [
          {
            label: 'Inscritos',
            data: procesos.map(p => p.personas_inscritas || 0),
            backgroundColor: '#0d6efd'
          },
          {
            label: 'Completados',
            data: procesos.map(p => p.personas_completadas || 0),
            backgroundColor: '#198754'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top', labels: { padding: 15, font: { size: 11 } } }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  };

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/gerencia/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      if (data.success) {
        setEstadisticas(data.data);
      } else {
        Swal.fire('Error', data.message || 'No se pudieron cargar las estadísticas', 'error');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gd-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando dashboards...</p>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="gd-error">
        <AlertCircle size={48} />
        <p>No se pudieron cargar las estadísticas</p>
        <button className="btn btn-primary" onClick={cargarEstadisticas}>Reintentar</button>
      </div>
    );
  }

  const { resumen, por_estado, por_proceso, por_curso } = estadisticas;
  const procesos = por_proceso || [];
  const detalles_procesos = por_curso || [];
  const porcentajeParticipacion = resumen.total_personas > 0
    ? Math.round((resumen.personas_participadas / resumen.total_personas) * 100)
    : 0;

  const exportarExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const fechaExporte = new Date().toLocaleDateString('es-ES');

      // Hoja de Resumen
      const dataResumen = [
        ['RESUMEN GENERAL DE CAPACITACIONES', ''],
        ['Fecha de Exportación', fechaExporte],
        [''],
        ['Métrica', 'Valor'],
        ['Total de Personas', resumen.total_personas],
        ['Personas Participadas', resumen.personas_participadas],
        ['Personas Pendientes', resumen.personas_pendientes],
        ['Porcentaje de Participación', `${porcentajeParticipacion}%`],
      ];
      const sheetResumen = XLSX.utils.aoa_to_sheet(dataResumen);
      sheetResumen['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, sheetResumen, 'Resumen');

      // Hoja de Estado General
      const dataEstado = [
        ['ESTADO DE PARTICIPACIÓN', ''],
        [''],
        ['Estado', 'Cantidad'],
        ['Completado', por_estado.completado],
        ['En Progreso', por_estado.en_progreso],
        ['No Iniciado', por_estado.no_iniciado],
      ];
      const sheetEstado = XLSX.utils.aoa_to_sheet(dataEstado);
      sheetEstado['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, sheetEstado, 'Estado General');

      // Hoja de Procesos (resumen)
      const dataProcesos = [
        ['ESTADÍSTICAS POR PROCESO', '', '', '', '', ''],
        ['Proceso', 'Inscritos', 'Completados', 'En Progreso', 'No Iniciados', 'Total Cursos'],
        ...procesos.map(p => [
          p.proceso_nombre,
          p.personas_inscritas || 0,
          p.personas_completadas || 0,
          p.personas_en_progreso || 0,
          p.personas_no_iniciadas || 0,
          p.total_cursos || 0,
        ])
      ];
      const sheetProcesos = XLSX.utils.aoa_to_sheet(dataProcesos);
      sheetProcesos['!cols'] = [
        { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheetProcesos, 'Por Proceso');

      // Hoja de Detalle de Cursos
      const dataDetalleCursos = [
        ['DETALLE DE CURSOS', '', '', '', '', ''],
        ['Proceso', 'Curso', 'Inscritos', 'Completados', 'En Progreso', 'No Iniciados'],
        ...detalles_procesos.map(d => [
          d.proceso_nombre,
          d.curso_nombre,
          d.personas_inscritas || 0,
          d.personas_completadas || 0,
          d.personas_en_progreso || 0,
          d.personas_no_iniciadas || 0,
        ])
      ];
      const sheetDetalle = XLSX.utils.aoa_to_sheet(dataDetalleCursos);
      sheetDetalle['!cols'] = [
        { wch: 35 }, { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheetDetalle, 'Detalle Cursos');

      // Crear una hoja por proceso con cursos organizados por año
      procesos.forEach(proceso => {
        const cursosProceso = detalles_procesos.filter(c => c.proceso_nombre === proceso.proceso_nombre);
        
        // Agrupar cursos por año
        const cursosPorAño = {};
        cursosProceso.forEach(curso => {
          const año = curso.año || 2026; // Si no hay año, asumir 2026
          if (!cursosPorAño[año]) {
            cursosPorAño[año] = [];
          }
          cursosPorAño[año].push(curso);
        });

        // Construir datos para la hoja
        const dataProcesoPorAño = [
          [`${proceso.proceso_nombre.toUpperCase()} - CURSOS POR AÑO`, '', '', '', '', ''],
          [''],
        ];

        // Ordenar años descendentemente
        const años = Object.keys(cursosPorAño).sort((a, b) => b - a);

        años.forEach(año => {
          dataProcesoPorAño.push([`AÑO ${año}`, '', '', '', '', '']);
          dataProcesoPorAño.push(['Curso', 'Inscritos', 'Completados', 'En Progreso', 'No Iniciados']);
          
          cursosPorAño[año].forEach(curso => {
            dataProcesoPorAño.push([
              curso.curso_nombre,
              curso.personas_inscritas || 0,
              curso.personas_completadas || 0,
              curso.personas_en_progreso || 0,
              curso.personas_no_iniciadas || 0,
            ]);
          });
          
          dataProcesoPorAño.push(['']);
        });

        // Crear hoja para este proceso
        const sheetProcesoPorAño = XLSX.utils.aoa_to_sheet(dataProcesoPorAño);
        sheetProcesoPorAño['!cols'] = [
          { wch: 50 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
        
        // Nombre de la hoja (máximo 31 caracteres en Excel)
        const nombreHoja = proceso.proceso_nombre.substring(0, 28);
        XLSX.utils.book_append_sheet(workbook, sheetProcesoPorAño, nombreHoja);
      });

      XLSX.writeFile(workbook, `Reportes_Gerencia_${fechaExporte}.xlsx`);
      Swal.fire({
        title: 'Éxito',
        text: 'Excel descargado correctamente',
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error exportando Excel:', error);
      Swal.fire('Error', 'Error al exportar a Excel', 'error');
    }
  };

  {/*
  const exportarPDF = async () => {
    try {
      Swal.fire({
        title: 'Generando PDF...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        allowEscapeKey: false
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;

      const tableX = 15;
      const tableW = pageWidth - 30;
      const rowH = 9;
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);

      // ==== HELPER: tabla horizontal con bordes ====
      const drawHorizontalTable = (headers, values, x, y, totalW, h, fontSize = 9) => {
        const colW = totalW / headers.length;
        const totalH = h * 2;

        // Borde exterior
        doc.rect(x, y, totalW, totalH);
        // Línea horizontal (separa encabezado de valores)
        doc.line(x, y + h, x + totalW, y + h);
        // Separadores verticales de columnas
        for (let i = 1; i < headers.length; i++) {
          doc.line(x + colW * i, y, x + colW * i, y + totalH);
        }

        doc.setFontSize(fontSize);

        // Encabezados (negrita, centrados)
        doc.setFont(undefined, 'bold');
        headers.forEach((header, i) => {
          const cx = x + i * colW + colW / 2;
          doc.text(String(header), cx, y + h - 3, {
            align: 'center',
            maxWidth: colW - 4,
          });
        });

        // Valores (centrados) — CORREGIDO: ahora usa 2h - 3
        doc.setFont(undefined, 'normal');
        values.forEach((v, i) => {
          const cx = x + i * colW + colW / 2;
          doc.text(String(v), cx, y + 2 * h - 3, { align: 'center' });
        });
      };

      // ━━━━━━━━━━━━━━ PÁGINA 1: PORTADA Y RESUMEN ━━━━━━━━━━━━━━
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Reporte de Capacitaciones', pageWidth / 2, yPos + 10, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      yPos += 30;
      doc.text(
        `Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`,
        15,
        yPos - 8,
        { align: 'left' }
      );

      // RESUMEN GENERAL
      yPos += 25;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen General', 15, yPos - 20);

      yPos += 5;
      drawHorizontalTable(
        ['Total Personas', 'Han Participado', 'No Participan', '% Participación'],
        [
          resumen.total_personas,
          resumen.personas_participadas,
          resumen.personas_pendientes,
          `${porcentajeParticipacion}%`
        ],
        tableX, yPos - 15, tableW, rowH, 10
      );

      yPos += rowH * 2 + 12;

      // ESTADO DE PARTICIPACIÓN
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Estado de Participación', 15, yPos - 15);
      yPos += 8;

      drawHorizontalTable(
        ['Completados', 'En Progreso', 'No Iniciados'],
        [
          por_estado.completado,
          por_estado.en_progreso,
          por_estado.no_iniciado
        ],
        tableX, yPos -15, tableW, rowH, 10
      );

      yPos += rowH * 2;

      // GRÁFICO DE PASTEL
      yPos = 15;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Gráficos de Análisis', 15, yPos+120);
      yPos += 135;

      const canvasPastel = chartRefPastel.current;
      if (canvasPastel) {
        try {
          const imgPastel = canvasPastel.toDataURL('image/png');
          doc.setFontSize(11);
          doc.setFont(undefined, 'normal');
          doc.text('Distribución de Estado:', 15, yPos);
          yPos += 5;
          doc.addImage(imgPastel, 'PNG', 40, yPos, 100, 100);
          yPos += 75;
        } catch (e) {
          console.log('No se pudo agregar gráfico pastel', e);
        }
      }

      // ━━━━━━━━━━━━━━ PÁGINA 2: GRÁFICOS ━━━━━━━━━━━━━━
      const canvasBarras = chartRefBarras.current;
      if (canvasBarras) {
        try {
          if (yPos > pageHeight - 120) {
            doc.addPage();
            yPos = 15;
          }
          const imgBarras = canvasBarras.toDataURL('image/png');
          doc.setFontSize(11);
          doc.setFont(undefined, 'normal');
          doc.text('Inscritos vs Completados por Proceso:', 15, yPos);
          yPos += 5;
          doc.addImage(imgBarras, 'PNG', 5, yPos, 195, 125);
        } catch (e) {
          console.log('No se pudo agregar gráfico barras', e);
        }
      }

      // ━━━━━━━━━━━━━━ PÁGINA 3: TABLA DE PROCESOS ━━━━━━━━━━━━━━
      doc.addPage();
      yPos = 15;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Estadísticas por Proceso', 15, yPos);
      yPos += 12;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      const columnWidths = [70, 28, 28, 28, 28];
      const tableStartX = 12;
      let tableY = yPos;
      const rowHeight = 8;
      const headers = ['Proceso', 'Inscritos', 'Completados', 'En Progreso', 'No Iniciados'];
      const headerColor = [8, 63, 115];
      const altRowColor = [245, 245, 245];
      const borderColor = [180, 180, 180];

      // === Encabezado de tabla (fill + border) ===
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setDrawColor(...borderColor);

      let xOffset = tableStartX;
      headers.forEach((header, idx) => {
        doc.setFillColor(...headerColor);
        doc.rect(xOffset, tableY, columnWidths[idx], rowHeight, 'FD');
        const colCenter = xOffset + columnWidths[idx] / 2;
        doc.text(header, colCenter, tableY + 5.5, { align: 'center', maxWidth: columnWidths[idx] - 2 });
        xOffset += columnWidths[idx];
      });

      tableY += rowHeight;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(255, 255, 255);

      // === Filas de datos ===
      procesos.forEach((p, rowIdx) => {
        const nombreLines = doc.splitTextToSize(p.proceso_nombre || '', columnWidths[0] - 4);
        const dynRowH = Math.max(rowHeight, nombreLines.length * 4.5 + 3);

        if (tableY + dynRowH > pageHeight - 20) {
          doc.addPage();
          tableY = 15;
        }

        // Fondo alterno
        if (rowIdx % 2 === 0) {
          doc.setFillColor(...altRowColor);
          let xo = tableStartX;
          columnWidths.forEach(w => {
            doc.rect(xo, tableY, w, dynRowH, 'F');
            xo += w;
          });
        }

        // Bordes (dibujo solo, sin relleno)
        doc.setDrawColor(...borderColor);
        let xoBorder = tableStartX;
        columnWidths.forEach(w => {
          doc.rect(xoBorder, tableY, w, dynRowH, 'S');
          xoBorder += w;
        });

        // Contenido
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        const rowData = [
          nombreLines,
          p.personas_inscritas?.toString() || '0',
          p.personas_completadas?.toString() || '0',
          p.personas_en_progreso?.toString() || '0',
          p.personas_no_iniciadas?.toString() || '0'
        ];

        let xo = tableStartX;
        rowData.forEach((cell, idx) => {
          if (idx === 0) {
            // Primera columna: alineado a la izquierda
            doc.text(cell, xo + 2, tableY + 5.5, { maxWidth: columnWidths[idx] - 4 });
          } else {
            // Resto de columnas: centrado
            const colCenter = xo + columnWidths[idx] / 2;
            doc.text(cell, colCenter, tableY + 5.5, { align: 'center' });
          }
          xo += columnWidths[idx];
        });

        tableY += dynRowH;
      });

      // Descargar
      doc.save(`Reporte_Gerencia_${new Date().toLocaleDateString('es-ES')}.pdf`);
      Swal.fire({
        title: 'Éxito',
        text: 'PDF generado correctamente',
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Swal.fire('Error', 'Error al generar PDF: ' + error.message, 'error');
    }
  }; */}

  return (
    <div className="gd-container">
      {/* ═══════════════════════════════════ TARJETAS DE RESUMEN ═══════════════════════════════════ */}
      <section className="gd-resumen">
        <h2 className="gd-section-title">Resumen General</h2>

        <div className="gd-cards-grid">
          <div className="gd-card gd-card-primary">
            <div className="gd-card-icon"><Users size={32} /></div>
            <div className="gd-card-content">
              <div className="gd-card-label">Personas Totales Inscritas</div>
              <div className="gd-card-value">{resumen.total_personas}</div>
            </div>
          </div>

          <div className="gd-card gd-card-success">
            <div className="gd-card-icon"><CheckCircle2 size={32} /></div>
            <div className="gd-card-content">
              <div className="gd-card-label">Han Participado</div>
              <div className="gd-card-value">{resumen.personas_participadas}</div>
              <div className="gd-card-percent">{porcentajeParticipacion}%</div>
            </div>
          </div>

          <div className="gd-card gd-card-warning">
            <div className="gd-card-icon"><AlertCircle size={32} /></div>
            <div className="gd-card-content">
              <div className="gd-card-label">Aún No Participan</div>
              <div className="gd-card-value">{resumen.personas_pendientes}</div>
              <div className="gd-card-percent">{100 - porcentajeParticipacion}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ ESTADO DE PARTICIPACIÓN ═══════════════════════════════════ */}
      <section className="gd-estado">
        <h2 className="gd-section-title">Estado de Participación</h2>

        <div className="gd-estado-grid">
          <div className="gd-estado-card gd-estado-completado">
            <div className="gd-estado-icon"><CheckCircle2 size={40} /></div>
            <div className="gd-estado-content">
              <div className="gd-estado-label">Cursos Completados</div>
              <div className="gd-estado-value">{por_estado.completado}</div>
              <div className="gd-estado-desc">Personas que completaron</div>
            </div>
          </div>

          <div className="gd-estado-card gd-estado-progreso">
            <div className="gd-estado-icon"><Clock size={40} /></div>
            <div className="gd-estado-content">
              <div className="gd-estado-label">En Progreso</div>
              <div className="gd-estado-value">{por_estado.en_progreso}</div>
              <div className="gd-estado-desc">Personas cursando actualmente</div>
            </div>
          </div>

          <div className="gd-estado-card gd-estado-no-iniciado">
            <div className="gd-estado-icon"><AlertCircle size={40} /></div>
            <div className="gd-estado-content">
              <div className="gd-estado-label">No Iniciados</div>
              <div className="gd-estado-value">{por_estado.no_iniciado}</div>
              <div className="gd-estado-desc">Personas sin iniciar cursos</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ PROCESOS ═══════════════════════════════════ */}
      <section className="gd-procesos">
        <h2 className="gd-section-title">Estadísticas por Proceso</h2>

        <div className="gd-procesos-list">
          {procesos && procesos.length > 0 ? (
            procesos.map((proceso, idx) => (
              <div key={idx} className="gd-proceso-item">
                <div className="gd-proceso-header">
                  <div className="gd-proceso-title">
                    <h3>{proceso.proceso_nombre}</h3>
                  </div>

                  <div className="gd-proceso-stats">
                    <div className="gd-stat">
                      <span className="gd-stat-label">Cursos</span>
                      <span className="gd-stat-value">{proceso.total_cursos}</span>
                    </div>
                    <div className="gd-stat">
                      <span className="gd-stat-label">Inscritos</span>
                      <span className="gd-stat-value">{proceso.personas_inscritas || 0}</span>
                    </div>
                    <div className="gd-stat gd-stat-completados">
                      <span className="gd-stat-label">Completados</span>
                      <span className="gd-stat-value">{proceso.personas_completadas || 0}</span>
                    </div>
                  </div>

                  <button
                    className="gd-proceso-toggle"
                    onClick={() => setExpandedProceso(expandedProceso === idx ? null : idx)}
                  >
                    {expandedProceso === idx ? '▼' : '▶'}
                  </button>
                </div>

                {expandedProceso === idx && (
                  <div className="gd-proceso-detalle">
                    <table className="gd-cursos-table">
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Inscritos</th>
                          <th>Completados</th>
                          <th>En Progreso</th>
                          <th>No Iniciados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles_procesos
                          .filter(d => {
                            const procName = (d.proceso_nombre || '').trim().toLowerCase().replace(/\s+/g, '_');
                            const compName = (proceso.proceso_nombre || '').trim().toLowerCase().replace(/\s+/g, '_');
                            return procName === compName && d.curso_nombre;
                          })
                          .map((curso, cidx) => (
                            <tr
                              key={cidx}
                              onClick={() => {
                                setCursoSeleccionado(curso);
                                setPanelAbierto(true);
                              }}
                              style={{ cursor: 'pointer' }}
                              className="curso-row-clickeable"
                            >
                              <td className="text-center-nombre-curso">{curso.curso_nombre}</td>
                              <td className="text-center">{curso.personas_inscritas || 0}</td>
                              <td className="text-center gd-completados">{curso.personas_completadas || 0}</td>
                              <td className="text-center gd-progreso">{curso.personas_en_progreso || 0}</td>
                              <td className="text-center gd-no-iniciado">{curso.personas_no_iniciadas || 0}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="gd-empty">
              <p>No hay procesos con cursos aún</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════ ACCIONES ═══════════════════════════════════ */}
      <div className="gd-acciones">
        <button className="btn-datos-actualizar" onClick={cargarEstadisticas}>
          <TrendingUp size={18} /> Actualizar Datos
        </button>
        <button className="btn-datos-excel" onClick={exportarExcel}>
          <Download size={18} /> Exportar a Excel
        </button>
        {/*
        <button className="btn-datos-pdf" onClick={exportarPDF}>
          <FileText size={18} /> Exportar a PDF
        </button>
        */}
      </div>

      <CursoDetailPanel
        curso={cursoSeleccionado}
        proceso={cursoSeleccionado?.proceso_nombre || ''}
        isOpen={panelAbierto}
        onClose={() => setPanelAbierto(false)}
      />

      <canvas ref={chartRefPastel} style={{ display: 'none' }} width="300" height="300"></canvas>
      <canvas ref={chartRefBarras} style={{ display: 'none' }} width="600" height="400"></canvas>
    </div>
  );
}

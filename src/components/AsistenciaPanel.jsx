import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/components/AsistenciaPanel.css';

/**
 * AsistenciaPanel
 * Tabla de asistencia para el admin de proceso.
 * Muestra nombre, cargo, fecha/hora de inicio y fin por curso.
 *
 * Props:
 *   onClose — callback para volver al inicio
 */
export default function AsistenciaPanel() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [asistencia, setAsistencia] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cursosUnicos, setCursosUnicos] = useState([]);

  useEffect(() => {
    cargarAsistencia();
    const intervalo = setInterval(cargarAsistencia, 30000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarAsistencia = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/inscripciones/asistencia/proceso`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const registros = data.data || [];
        setAsistencia(registros);

        // Extraer cursos únicos para el filtro
        const cursos = [...new Map(registros.map(r => [r.curso_id, r.curso_nombre])).entries()]
          .map(([id, nombre]) => ({ id, nombre }));
        setCursosUnicos(cursos);
      } else {
        console.error('Error:', data.message);
      }
    } catch (err) {
      console.error('Error cargando asistencia:', err);
    } finally {
      setCargando(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const d = new Date(fechaStr);
      const dia  = d.getDate().toString().padStart(2, '0');
      const mes  = (d.getMonth() + 1).toString().padStart(2, '0');
      const anio = d.getFullYear();
      const hora = d.getHours().toString().padStart(2, '0');
      const min  = d.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes}/${anio} ${hora}:${min}`;
    } catch {
      return fechaStr;
    }
  };

  const etiquetaEstado = (estado) => {
    switch (estado) {
      case 'completado':  return { label: '✅ Completado',  cls: 'badge-completado'  };
      case 'en progreso': return { label: '🔵 En progreso', cls: 'badge-en-progreso' };
      default:            return { label: '⚪ Sin iniciar',  cls: 'badge-no-iniciado' };
    }
  };

  // ── Filtros ───────────────────────────────────────────────────
  const registrosFiltrados = asistencia.filter(r => {
    const coincideCurso  = !filtroCurso || String(r.curso_id) === filtroCurso;
    const coincideEstado = filtroEstado === '' || r.estado === filtroEstado;
    return coincideCurso && coincideEstado;
  });

  // ── Exportar a CSV ────────────────────────────────────────────
  const exportarCSV = () => {
    const cabecera = ['Nombre', 'Cédula', 'Proceso', 'Cargo', 'Curso', 'Fecha Inicio', 'Estado'];
    const filas = registrosFiltrados.map(r => [
      r.usuario_nombre,
      r.cedula_identidad,
      r.usuario_proceso,
      r.usuario_cargo,
      r.curso_nombre,
      formatearFecha(r.inicio_en),
      r.estado
    ]);

    const contenido = [cabecera, ...filas]
      .map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'asistencia.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF solo activo cuando hay curso seleccionado + estado completado ────
  const pdfActivo = filtroCurso !== '' && filtroEstado === 'completado';

  // ── Exportar a PDF ────────────────────────────────────────────
  const exportarPDF = async () => {
    if (!pdfActivo) return;

    // Pre-cargar logo como base64
    let logoDataUrl = null;
    try {
      const resp = await fetch('/img/safemedic.png');
      const blob = await resp.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e);
    }

    // Datos del curso
    const primerRegistro   = registrosFiltrados[0] || {};
    const nombreCurso      = primerRegistro.curso_nombre        || '—';
    const fechaFallback    = registrosFiltrados
      .map(r => r.inicio_en)
      .filter(Boolean)
      .sort()[0] || null;
    const fechaInicioCurso = primerRegistro.curso_fecha_inicio
      ? formatearFecha(primerRegistro.curso_fecha_inicio)
      : fechaFallback
        ? formatearFecha(fechaFallback)
        : '—';
    const descripcionCurso = primerRegistro.curso_descripcion   || '—';
    const dirigidoA        = primerRegistro.curso_dirigido_a    || '—';

    // Nombre del admin desde localStorage
    const adminUser   = JSON.parse(localStorage.getItem('admin_proceso_user') || '{}');
    const responsable = adminUser.nombre || '—';

    const doc   = new jsPDF('portrait', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();   // 210mm
    const pageH = doc.internal.pageSize.getHeight();  // 297mm
    const mL    = 14;
    const mR    = 14;
    const useW  = pageW - mL - mR;  // 182mm

    // ── Colores ────────────────────────────────────────────────
    const FONDO_PRINCIPAL  = [255, 255, 255]; // Cambiado a blanco para el título
    const FONDO_SECUNDARIO = [255, 255, 255];
    const BORDE        = [0, 0, 0];
    const TEXTO_OSCURO = [0,  0,  0];

    // ── Helper: dibuja una celda con borde, fondo y texto ─────
    const celda = (x, y, w, h, texto, negrita = false, fondo = null) => {
      if (fondo) {
        doc.setFillColor(...fondo);
        doc.rect(x, y, w, h, 'F');
      }
      doc.setDrawColor(...BORDE);
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h, 'S');
      doc.setFontSize(9);
      doc.setTextColor(...TEXTO_OSCURO);
      doc.setFont('helvetica', negrita ? 'bold' : 'normal');
      const lineas = doc.splitTextToSize(texto, w - 4);
      doc.text(lineas, x + 3, y + 6);
    };

    let y = mL;

    // ── Fila 0: título ─────────────────────────────────────────
    const tituloH = 25;


    // Fondo del Título
    doc.setFillColor(...FONDO_PRINCIPAL);
    doc.rect(mL, y, useW, tituloH, 'F');
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.3);
    doc.rect(mL, y, useW, tituloH, 'S');

    // Imagen de la izquierda
    const fotoX = mL + 5;
    const fotoY = y + 5;
    const ancho = 40
    const alto = 12

    {/*
    // Celda para la imagen
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.3);
    doc.rect(fotoX, fotoY, ancho, alto, 'S');
    */}

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', fotoX, fotoY, ancho, alto);
    }

    const tituloX = fotoX + ancho + 15;
    const tituloW = useW - ancho - 80;
    const tituloY = y ;
    const tituloAlto = alto;

    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.3);
    // Línea izquierda
    doc.line(tituloX -10 , tituloY , tituloX - 10, tituloY + 25);

    // Línea derecha
    doc.line(tituloX + tituloW + 10 , tituloY , tituloX + tituloW + 10, tituloY + 25);
    // Texto del título
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO DE ASISTENCIA Y PARTICIPACIÓN', tituloX + (tituloW / 2)  ,  tituloY + (tituloAlto / 2) + 6, { align: 'center' });

    
    // Texto de la derecha
    const textoDerecha = [
      'Código: RG-GTH-04', 
      '',
      'Fecha: 08-07-2026', 
      '',
      'Versión: 10'
    ];

  // Texto dentro de la celda
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
    
  const textX = mL + useW - 45; // Ajusta la posición horizontal según tus necesidades
  const textY = y + 6;
  const lineHeight = 3;

  textoDerecha.forEach((linea, index) => {
    doc.text(linea, textX, textY + index * lineHeight, { align: 'left' });
  });

  y += tituloH;

    // ── Dimensiones de columnas ────────────────────────────────
    const etqW  = 35;                         // columna etiqueta
    const rowH  = 8;                          // altura fila estándar
    const valW  = useW - etqW;                // columna valor (fila simple)

    // ── Fila 1: TEMA ───────────────────────────────────────────
    celda(mL,        y, etqW, rowH, 'TEMA:',        true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, rowH, nombreCurso);
    y += rowH;

    // ── Fila 2: FECHA | RESPONSABLE ────────────────────────────
    // Dividimos el área de valores en dos mitades iguales
    const mitad     = (useW - etqW * 2) / 2;
    const xFechaVal = mL + etqW;
    const xRespEtq  = xFechaVal + mitad;
    const xRespVal  = xRespEtq + etqW;
    const respValW  = useW - etqW * 2 - mitad;

    celda(mL,        y, etqW,    rowH, 'FECHA:',        true, FONDO_SECUNDARIO);
    celda(xFechaVal, y, mitad,   rowH, fechaInicioCurso);
    celda(xRespEtq,  y, etqW,    rowH, 'RESPONSABLE:',  true, FONDO_SECUNDARIO);
    celda(xRespVal,  y, respValW, rowH, responsable);
    y += rowH;

    // ── Fila 3: DIRIGIDO A ─────────────────────────────────────
    celda(mL,        y, etqW, rowH, 'DIRIGIDO A:', true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, rowH, dirigidoA);
    y += rowH;

    // ── Fila 4: DESCRIPCIÓN (altura variable) ──────────────────
    const descLineas = doc.splitTextToSize(descripcionCurso, valW - 6);
    const descH      = Math.max(rowH, descLineas.length * 4.5 + 4);
    celda(mL,        y, etqW, descH, 'DESCRIPCIÓN:', true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, descH, descripcionCurso);
    y += descH + 2;

    // ── Tabla de asistencia ────────────────────────────────────
    const headers = ['N°', 'APELLIDOS Y NOMBRES', 'CÉDULA', 'CARGO', 'FECHA INICIO', 'ESTADO'];
    const rows = registrosFiltrados.map((r, idx) => [
      idx + 1,
      r.usuario_nombre,
      r.cedula_identidad || '—',
      r.usuario_cargo,
      r.inicio_en ? formatearFecha(r.inicio_en) : '—',
      r.estado || '—',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y,
      styles: { 
        fontSize: 9, 
        cellPadding: 2.5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3
      },
      headStyles: { 
        fillColor: FONDO_PRINCIPAL, 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        fontStyle: 'bold',
        halign: 'center'
       },
        
      alternateRowStyles: { fillColor: FONDO_SECUNDARIO },
      columnStyles: {
        0: { cellWidth: 9.5,  halign: 'center' },
        1: { cellWidth: 55,  halign: 'center'   },
        2: { cellWidth: 25,  halign: 'center' },
        3: { cellWidth: 40,  halign: 'center'   },
        4: { cellWidth: 30,  halign: 'center' },
        5: { cellWidth: 25,  halign: 'center' },
      },
    });

    // Obtener la posicion Y y despues la Tabla
    

    // ── Pie de página ──────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY + 10;

    const espacioDisponible = pageH - finalY - 15; // 20mm de margen inferior

    const ancho1 = 60;
    const ancho2 = 60;
    const ancho3 = useW - ancho1 - ancho2; 
    const cuadroAlto = 22;
    const espacioEntreCuadros = 0;
    const alturaTotalCuadros = cuadroAlto + 8;

    let yCuadros;

    if (espacioDisponible > alturaTotalCuadros){
      yCuadros = pageH - cuadroAlto - 15; // 15mm de margen inferior
    } else {
      yCuadros = pageH - cuadroAlto - 15; // Si no hay espacio, los ponemos justo después de la tabla
    }

    const x1 = mL;
    const x2 = x1 + ancho1 + espacioEntreCuadros;
    const x3 = x2 + ancho2 + espacioEntreCuadros;

    const ancho4 = useW - (x3 - mL); // Ancho total de los tres cuadros

    const dibujarCuadro = (x, y, w, h, textoSuperior, textoInferior = '') => {
      doc.setDrawColor(...BORDE);
      doc.setLineWidth(0.3);
      doc.rect(x,y, w, h, 'S');

      //TEXTO SUPERIOR
      doc.setFontSize(9);
      doc.setTextColor(...TEXTO_OSCURO);
      doc.setFont('helvetica', 'bold');
      const lineasSuperior = doc.splitTextToSize(textoSuperior, w - 6);
      doc.text(lineasSuperior, x + (w / 2), y + 18, { align: 'center' });

      // LINEA SEPARADORA 
      //doc.setDrawColor(200, 200, 200);
      //doc.setLineWidth(0.1);
      //doc.line(x + 3, y + 14, x + w - 4, y + 14);

      if(textoInferior) {
        doc.setFontSize(9);
        doc.setTextColor(...TEXTO_OSCURO);
        doc.setFont('helvetica', 'normal');
        const lineasInferior = doc.splitTextToSize(textoInferior, w - 6);
        doc.text(lineasInferior, x + (w / 2), y + 18, { align: 'center' });
      }
    };
    
    dibujarCuadro(x1, yCuadros, ancho1, cuadroAlto, 'CONDUCIDO POR');

    const textoSegundo = `DPTO. RESPONSABLE`;
    dibujarCuadro(x2, yCuadros, ancho2, cuadroAlto, textoSegundo, '');

    dibujarCuadro(x3, yCuadros, ancho3, cuadroAlto, 'JEFE DE TALENTO HUMANO', '');

    y = finalY + cuadroAlto + 8;
    {/*
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const fechaReporte = new Date().toLocaleString('es-EC', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
      doc.text(`Generado: ${fechaReporte}`, mL, pageH - 6);
      doc.text(`Página ${i} de ${totalPages}`, pageW - mR, pageH - 6, { align: 'right' });
    }
      */}

    const nombreArchivo = `asistencia_${nombreCurso.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="asistencia-panel">

      {/* Toolbar */}
      <div className="asistencia-toolbar">
        {/*
        <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
          <ArrowLeft size={16} className="me-1" /> Volver
        </button>
        */}

        <div className="asistencia-filtros">
          {/* Filtro por curso */}
          <select
            className="form-select form-select-sm"
            value={filtroCurso}
            onChange={e => setFiltroCurso(e.target.value)}
          >
            <option value="">Todos los cursos</option>
            {cursosUnicos.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nombre}</option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            className="form-select form-select-sm"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="no iniciado">Sin iniciar</option>
            <option value="en progreso">En progreso</option>
            <option value="completado">Completado</option>
          </select>

          <button className="btn btn-outline-secondary btn-sm" onClick={cargarAsistencia} title="Actualizar">
            <RefreshCw size={15} />
          </button>

          <button className="btn btn-outline-success btn-sm" onClick={exportarCSV} title="Exportar CSV">
            <Download size={15} className="me-1" /> CSV
          </button>

          <button
            className="btn-download-pdf"
            onClick={exportarPDF}
            title={pdfActivo ? 'Exportar PDF' : 'Selecciona un curso y filtra por "Completado" para exportar'}
            disabled={!pdfActivo}
            style={{ opacity: pdfActivo ? 1 : 0.45, cursor: pdfActivo ? 'pointer' : 'not-allowed' }}
          >
            <Download size={15} className="me-1" /> PDF
          </button>
        </div>
      </div>

      {/* Conteo */}
      <p className="asistencia-conteo">
        {registrosFiltrados.length} registro(s) encontrado(s)
        {asistencia.length !== registrosFiltrados.length && ` de ${asistencia.length} total`}
      </p>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="alert alert-info text-center">
          No hay registros de asistencia para los filtros seleccionados.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover asistencia-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Proceso</th>
                <th>Cargo</th>
                <th>Cédula</th>
                <th>Curso</th>
                <th>Fecha / Hora Inicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r, idx) => {
                const { label, cls } = etiquetaEstado(r.estado);
                return (
                  <tr key={r.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td className="fw-semibold">{r.usuario_nombre}</td>
                    <td className="fw-semibold">{r.usuario_proceso}</td>
                    <td>{r.usuario_cargo}</td>
                    <td className="text-muted">{r.cedula_identidad}</td>
                    <td>{r.curso_nombre}</td>
                    <td className="asistencia-fecha">{formatearFecha(r.inicio_en)}</td>
                    <td><span className={`asistencia-badge ${cls}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import '../styles/components/AsistenciaPanel.css';

/**
 * AsistenciaPanel
 * Tabla de asistencia para el admin de proceso.
 * Muestra nombre, cargo y fechas de asistencia por curso.
 *
 * Props:
 *   onClose — callback para volver al inicio
 */
export default function AsistenciaPanel({
  asistenciaUrl = '/api/inscripciones/asistencia/proceso',
  ordenarPorNombre = false,
}) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [asistencia, setAsistencia] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [cursosUnicos, setCursosUnicos] = useState([]);

  useEffect(() => {
    console.log('🔄 [AsistenciaPanel] Componente montado');
    cargarAsistencia();
    const intervalo = setInterval(cargarAsistencia, 30000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarAsistencia = async () => {
    setCargando(true);
    try {
      console.log('📊 [AsistenciaPanel] Iniciando carga de asistencia...');
      console.log('   URL:', `${API_URL}${asistenciaUrl}`);
      console.log('   Token disponible:', !!token);
      
      const res = await fetch(`${API_URL}${asistenciaUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('   Response status:', res.status);
      console.log('   Response ok:', res.ok);
      
      const data = await res.json();
      console.log('   Response data:', data);
      console.log('   Data.success:', data.success);
      console.log('   Registros recibidos:', data.data?.length || 0);
      
      if (res.ok && data.success) {
        const registros = data.data || [];
        console.log('✅ Asistencia cargada correctamente:', registros.length, 'registros');
        const registrosOrdenados = ordenarPorNombre
          ? [...registros].sort((a, b) =>
              (a.usuario_nombre || '').localeCompare(b.usuario_nombre || '', 'es', { sensitivity: 'base' })
            )
          : registros;
        setAsistencia(registrosOrdenados);

        // Extraer cursos únicos para el filtro y ordenar alfabéticamente
        const cursos = [...new Map(registrosOrdenados.map(r => [r.curso_id, r.curso_nombre])).entries()]
          .map(([id, nombre]) => ({ id, nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        setCursosUnicos(cursos);
      } else {
        console.error('❌ Error en respuesta:', data.message);
      }
    } catch (err) {
      console.error('❌ Error en cargarAsistencia:', err);
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
      return `${dia}/${mes}/${anio}`;
    } catch {
      return fechaStr;
    }
  };

  // Capitaliza la primera letra
  const capitalizarEstado = (estado) => {
    if (!estado) return estado;
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const etiquetaEstado = (estado) => {
    switch (estado) {
      case 'completado':  return { label: '✅ Completado',  cls: 'badge-completado'  };
      case 'en progreso': return { label: '🔵 En progreso', cls: 'badge-en-progreso' };
      default:            return { label: '⚪ Sin iniciar',  cls: 'badge-no-iniciado' };
    }
  };

  // ── Filtros ───────────────────────────────────────────────────
  const empresasUnicas = [...new Set(asistencia.map(r => r.empresa_socio).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));

  const coincideEmpresa = (r) => !filtroEmpresa || r.empresa_socio === filtroEmpresa;

  const registrosFiltrados = asistencia.filter(r => {
    const coincideCurso  = !filtroCurso || String(r.curso_id) === filtroCurso;
    const coincideEstado = filtroEstado === '' || r.estado === filtroEstado;
    return coincideCurso && coincideEstado && coincideEmpresa(r);
  });
  const registrosCurso = asistencia.filter(
    r => filtroCurso !== '' && String(r.curso_id) === filtroCurso && coincideEmpresa(r)
  );

  // ── Exportar a CSV ────────────────────────────────────────────
  const exportarExcel = () => {
    const filas = [
      ['Apellidos y Nombres', 'Cédula', 'Proceso', 'Empresa Socio', 'Cargo', 'Curso', 'Fecha Inicio', 'Estado'],
      ...registrosFiltrados.map(r => [
        r.usuario_nombre,
        r.cedula_identidad,
        r.usuario_proceso,
        r.empresa_socio || '—',
        r.usuario_cargo,
        r.curso_nombre,
        formatearFecha(r.inicio_en),
        capitalizarEstado(r.estado)
      ])
    ];

    const hoja = XLSX.utils.aoa_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Asistencia');
    XLSX.writeFile(libro, 'asistencia.xlsx');

  };

  // El PDF incluye todas las inscripciones del curso, sin importar su estado.
  const pdfActivo = registrosCurso.length > 0;

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

    let firmaDataUrl = null;
    try {
      const resp = await fetch('/img/firma.png');
      const blob = await resp.blob();
      firmaDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('No se pudo cargar la firma:', e);
    }

    // Datos del curso
    const primerRegistro   = registrosCurso[0] || {};
    const nombreCurso      = primerRegistro.curso_nombre        || '—';
    const fechaFallback    = registrosCurso
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
    const duracion = primerRegistro.curso_duracion || '—';
    const procesoCurso = (primerRegistro.curso_proceso || '—');

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
      'Fecha: 27-08-2026', 
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
    const etqW  = 35;                       // columna etiqueta
    const rowH  = 8;                       // altura fila estándar
    const valW  = useW - etqW;                // columna valor (fila simple)

    // ── Fila 1: TEMA (altura variable) ─────────────────────────
    const temaLineas = doc.splitTextToSize(nombreCurso, valW - 6);
    const temaH = Math.max(rowH, temaLineas.length * 3 + 5);
    celda(mL,        y, etqW, temaH, 'TEMA:',        true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, temaH, nombreCurso);
    y += temaH;

    // ── Fila 2: FECHA | DURACIÓN ────────────────────────────
    // Dividimos el área de valores en dos mitades iguales
    const mitad     = (useW - etqW * 2) / 2;
    const xFechaVal = mL + etqW;
    const xRespEtq  = xFechaVal + mitad;
    const xRespVal  = xRespEtq + etqW;
    const respValW  = useW - etqW * 2 - mitad;

    celda(mL,        y, etqW,    rowH, 'FECHA (dd/mm/aa):',        true, FONDO_SECUNDARIO);
    celda(xFechaVal, y, mitad,   rowH, fechaInicioCurso);
  
    celda(xRespEtq,  y, etqW,    rowH, 'DURACIÓN:',  true, FONDO_SECUNDARIO);
    celda(xRespVal,  y, respValW, rowH, duracion);
    y += rowH;

    // ── Fila 3: LUGAR + RESPONSABLE
    const mitad2 = (useW - etqW * 2)/2;
    const xLugar = mL + etqW;
    const xResponsable = xLugar + mitad2;
    const respValW2 = useW - etqW * 2 - mitad2;

    celda(mL,   y, etqW,   rowH, 'LUGAR:', true, FONDO_SECUNDARIO);
    celda(xLugar, y, mitad2, rowH, 'Plataforma Virtual');

    celda(xResponsable, y, etqW, rowH, 'RESPONSABLE', true, FONDO_SECUNDARIO);
    celda(xResponsable + etqW, y, respValW2, rowH, responsable);
    y += rowH;



    // ── Fila 4: DIRIGIDO A ─────────────────────────────────────
    const dirigidoLineas = doc.splitTextToSize(dirigidoA, valW - 6);
    const dirigidoH = Math.max(rowH, dirigidoLineas.length * 3 + 5); 
    celda(mL,        y, etqW, dirigidoH, 'DIRIGIDO A:', true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, dirigidoH, dirigidoA);
    y += dirigidoH;

    // ── Fila 5: DESCRIPCIÓN (altura variable) ──────────────────
    const descLineas = doc.splitTextToSize(descripcionCurso, valW - 6);
    const descH      = Math.max(rowH, descLineas.length * 4.5 + 4);
    celda(mL,        y, etqW, descH, 'DETALLE:', true, FONDO_SECUNDARIO);
    celda(mL + etqW, y, valW, descH, descripcionCurso);
    y += descH + 2;

    // ── Tabla de asistencia ────────────────────────────────────
    const headers = ['N°', 'APELLIDOS Y NOMBRES', 'CÉDULA', 'CARGO', 'ESTADO / FIRMA'];
    const rows = registrosCurso.map((r, idx) => [
      idx + 1,
      r.usuario_nombre,
      r.cedula_identidad || '—',
      r.usuario_cargo,
      //r.inicio_en ? formatearFecha(r.inicio_en) : '—',
      capitalizarEstado(r.estado) || '—',
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
        0: { cellWidth: 10.5,  halign: 'center' },
        1: { cellWidth: 60,  halign: 'center'   },
        2: { cellWidth: 30,  halign: 'center' },
        3: { cellWidth: 48,  halign: 'center'   },
        4: { cellWidth: 35,  halign: 'center' },
        //5: { cellWidth: 25,  halign: 'center' },
      },
    });

    // Obtener la posicion Y y despues la Tabla
    

    // ── Pie de página ──────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY + 10;

    const margenInferior = 15;

    const ancho1 = 60;
    const ancho2 = 60;
    const ancho3 = useW - ancho1 - ancho2; 
    const cuadroAlto = 25;
    const espacioEntreCuadros = 0;
    const alturaTotalCuadros = cuadroAlto + 8;

    let yCuadros;

    if (finalY + alturaTotalCuadros <= pageH - margenInferior) {
      yCuadros = pageH - cuadroAlto - margenInferior;
    } else {
      // No cabe debajo de la tabla: las firmas van en una página nueva
      doc.addPage();
      yCuadros = mL + 3; // dibujarCuadro dibuja el recuadro 3mm por encima de y
    }

    const x1 = mL;
    const x2 = x1 + ancho1 + espacioEntreCuadros;
    const x3 = x2 + ancho2 + espacioEntreCuadros;

    //const ancho4 = useW - (x3 - mL); // Ancho total de los tres cuadros

    const dibujarCuadro = (x, y, w, h, textoSuperior, textoInferior = '') => {
      doc.setDrawColor(...BORDE);
      doc.setLineWidth(0.3);
      doc.rect(x,y-3, w, h, 'S');

      // Texto superior e inferior del cuadro
      doc.setFontSize(9);
      doc.setTextColor(...TEXTO_OSCURO);
      doc.setFont('helvetica', 'normal');
      const lineasSuperior = doc.splitTextToSize(textoSuperior, w - 6);
      doc.text(lineasSuperior, x + (w / 2), y + 7, { align: 'center' });
      

      // LINEA SEPARADORA 
      //doc.setDrawColor(200, 200, 200);
      //doc.setLineWidth(0.1);
      //doc.line(x + 3, y + 14, x + w - 4, y + 14);

      if(textoInferior) {
        doc.setFontSize(9);
        doc.setTextColor(...TEXTO_OSCURO);
        doc.setFont('helvetica', 'bold');
        const lineasInferior = doc.splitTextToSize(textoInferior, w - 6);
        doc.text(lineasInferior, x + (w / 2), y + 18, { align: 'center'});
      }
    };
    
    dibujarCuadro(x1, yCuadros, ancho1, cuadroAlto, responsable, 'CONDUCIDO POR');

    dibujarCuadro(x2, yCuadros, ancho2, cuadroAlto, procesoCurso, 'PROCESO RESPONSABLE');

    dibujarCuadro(x3 , yCuadros, ancho3, cuadroAlto, '', 'JEFE DE TALENTO HUMANO');
    if (firmaDataUrl) {
      doc.addImage(firmaDataUrl, 'PNG', x3 + ((ancho3 - 35) / 2), yCuadros - 2, 35, 15);
    }

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

          {/* Filtro por empresa socio */}
          <select
            className="form-select form-select-sm"
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
          >
            <option value="">Todas las empresas</option>
            {empresasUnicas.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          <button className="btn-actualizar-asistencia" onClick={cargarAsistencia} title="Actualizar">
            <RefreshCw size={15} />
          </button>

          <button className="btn btn-outline-success btn-sm" onClick={exportarExcel} title="Exportar Excel">
            <Download size={15} className="me-1" /> Excel
          </button>

          <button
            className="btn-download-pdf"
            onClick={exportarPDF}
            title={pdfActivo ? 'Exportar PDF con todos los inscritos, sin importar su estado' : 'Selecciona un curso con registros para exportar'}
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
                <th>Fecha</th>
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
                    <td>{r.cedula_identidad}</td>
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

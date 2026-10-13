import { useState, useEffect } from 'react';
import { Award, Download, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/pages/certificado.css';

/**
 * PLANTILLA BASE DE CERTIFICADOS
 * ================================
 *
 * Este componente actúa como:
 * 1. Visor de certificados emitidos para el usuario
 * 2. Generador de PDF de certificados
 * 3. Base reutilizable para todos los cursos que emitan certificados
 *
 * Los certificados se emiten AUTOMÁTICAMENTE cuando:
 * - El usuario completa el curso
 * - El usuario aprueba la evaluación (calificación >= 70%)
 * - El admin habilitó "Emitir certificado" al crear el curso
 */

export default function Certificado() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('user_token');
  const usuarioLocal = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');

  // ═══════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════

  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'emitido', 'descargado'
  const [perfil, setPerfil] = useState(null);
  const [completadosEstaticos, setCompletadosEstaticos] = useState([]);
  const [pruebaEstatica, setPruebaEstatica] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    Promise.all([cargarPerfil(), cargarCertificados(), cargarEstaticosYPrueba()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA
  // ═══════════════════════════════════════════════════════════════

  const cargarPerfil = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/mi-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPerfil(data.data);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const cargarCertificados = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/certificados/usuario`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCertificados(data.data || []);
      } else {
        console.error('Error al cargar certificados:', data.message);
        setCertificados([]);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar los certificados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstaticosYPrueba = async () => {
    const nombreUsuario = localStorage.getItem('usuario');
    if (!nombreUsuario) return;
    try {
      const [resComp, resPrueba] = await Promise.all([
        fetch(`${API_URL}/api/progreso/cursos-completados/${encodeURIComponent(nombreUsuario)}`),
        fetch(`${API_URL}/api/resultados/mis-intentos/Talento%20Humano?nombre=${encodeURIComponent(nombreUsuario)}`),
      ]);
      const dataComp = await resComp.json();
      const dataPrueba = await resPrueba.json();
      if (dataComp.ok) setCompletadosEstaticos(dataComp.cursosCompletados || []);
      if (dataPrueba.ok) setPruebaEstatica({
        mejor_puntaje: dataPrueba.mejor_puntaje,
        aprobado: dataPrueba.aprobado,
        ultima_fecha: dataPrueba.intentos?.[0]?.fecha_registro || null,
      });
    } catch (err) {
      console.error('Error cargando datos estáticos TTHH:', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE GENERACIÓN DE CERTIFICADOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Genera un certificado en PDF para un curso específico
   */
  const generarCertificadoGeneral = async (
    nombreUsuario,
    cedula,
    cargo,
    nombreCurso,
    calificacion,
    fecha,
    firmas = [],
    certificadoId = null,
    logo = '/img/safemedic.png'
  ) => {
    try {
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

      let logoBase64 = null;
      let firmasBase64 = [];

      try {
        logoBase64 = await toBase64(logo);

        // Cargar todas las firmas en paralelo, conservando la posición original
        if (firmas && firmas.length > 0) {
          firmasBase64 = await Promise.all(
            firmas.map(async (firma) => ({
              nombre_admin: firma.nombre_admin || 'Administrador',
              cargo: firma.cargo || 'Cargo',
              imagen: firma.imagen_firma_url
                ? await toBase64(firma.imagen_firma_url).catch(() => null)
                : null,
            }))
          );
        }
      } catch {
        console.warn('No se pudieron cargar las imágenes');
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // ── DISEÑO Y ESTILOS ──
      doc.setFillColor(0, 184, 198);
      doc.triangle(0, H, W * 0.20, H, 0, H * 0.5, 'F');

      doc.setFillColor(13, 45, 62);
      doc.triangle(0, 0, W * 0.28, 0, 0, H - 60, 'F');

      doc.setFillColor(212, 175, 55);
      doc.circle(W * 0.08, H * 0.10, W * 0.07, 'F');

      // ── LOGO ──
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', W - 85, 5, 75, 25);
      }

      // ── TÍTULO ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.setTextColor(212, 175, 55);
      doc.text('CERTIFICADO', W / 2 + 40, 58, { align: 'center' });

      // ── ENCABEZADO ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(68, 68, 68);
      doc.text('Otorgado a', W / 2 + 40, 72, { align: 'center' });

      // ── NOMBRE DEL USUARIO ──
      doc.setFont('times', 'italic');
      doc.setFontSize(30);
      doc.setTextColor(0, 0, 0);
      doc.text(nombreUsuario.toUpperCase(), W / 2 + 30, 87, { align: 'center' });

      // ── INFORMACIÓN DEL USUARIO ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(85, 85, 85);
      doc.text(`C.I.: ${cedula}  |  Cargo: ${cargo}`, W / 2 + 30, 96, { align: 'center' });

      // ── PÁRRAFO INTRODUCTORIO ──
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text('Por haber completado y aprobado satisfactoriamente la capacitación:', W / 2 + 35, 108, { align: 'center' });

      // ── NOMBRE DEL CURSO ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(13, 45, 62);
      const cursoLines = doc.splitTextToSize(nombreCurso, 170);
      doc.text(cursoLines, W / 2 + 35, 120, { align: 'center' });

      const nextY = 120 + cursoLines.length * 7;

      // ── CALIFICACIÓN Y FECHA ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      if (calificacion != null) {
        doc.text(`Calificación obtenida: ${Number(calificacion).toFixed(1)}%`, W / 2 - 20, nextY + 10, {
          align: 'center',
        });
      }
      doc.text(`Fecha: ${fecha}`, W / 2 + 100, nextY + 10, { align: 'center' });

      {/* // ── LÍNEA DE FIRMA ──
      doc.setDrawColor(20, 103, 129);
      doc.setLineWidth(0.8);
      doc.line(W / 2, H - 25, W / 2 + 85, H - 25); */}

      // ── FIRMAS (DINÁMICAS) ──
      const numFirmas = firmasBase64.length;
      let firmaPositions = [];

      if (numFirmas === 1) {
        firmaPositions = [{ x: W / 2 + 10, y: H - 58 }];
      } else if (numFirmas === 2) {
        firmaPositions = [
          { x: W / 2 - 40, y: H - 58 },
          { x: W / 2 + 50, y: H - 58 },
        ];
      } else if (numFirmas >= 3) {
        firmaPositions = [
          { x: W / 2 - 90, y: H - 58 },
          { x: W / 2 - 10, y: H - 58 },
          { x: W / 2 + 70, y: H - 58 },
        ];
      }

      firmasBase64.forEach((firma, index) => {
        if (firma.imagen && firmaPositions[index]) {
          const pos = firmaPositions[index];
          doc.addImage(firma.imagen, 'PNG', pos.x, pos.y, 65, 32);

          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(firma.nombre_admin, pos.x + 32.5, H - 15, { align: 'center' });
          doc.text(firma.cargo, pos.x + 32.5, H - 7, { align: 'center' });
        }
      });

      // ── DESCARGAR ──
      const nombreArchivo = `Certificado_${nombreUsuario.replace(/\s+/g, '_')}_${nombreCurso
        .slice(0, 20)
        .replace(/\s+/g, '_')}.pdf`;
      doc.save(nombreArchivo);

      // Marcar como descargado (por ID)
      if (certificadoId) {
        await marcarComoDescargado(certificadoId);
      }
    } catch (error) {
      console.error('Error generando certificado:', error);
      Swal.fire('Error', 'No se pudo generar el certificado', 'error');
    }
  };

  /**
   * Genera certificado especial para los 4 cursos estáticos de Talento Humano
   */
  const generarCertificadoTTHH = async () => {
    const nombreUsuario = perfil?.nombre || usuarioLocal.nombre || 'Usuario';
    const nombre = nombreUsuario;

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

    let logoBase64 = null;
    let firmaBase64 = null;
    try {
      [logoBase64, firmaBase64] = await Promise.all([
        toBase64('/img/safemedic.png'),
        toBase64('/img/firma.png'),
      ]);
    } catch (error) {
      console.warn('⚠️ No se cargaron imagen o firma:', error);
    }

    try {
      const doc = new jsPDF('L', 'mm', 'letter');
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // ── FONDO DECORATIVO ──
      doc.setFillColor(0, 184, 198);
      doc.triangle(0, H, W * 0.40, H, 0, H * 0.5, 'F');

      doc.setFillColor(13, 45, 62);
      doc.triangle(0, 0, W * 0.28, 0, 0, H - 60, 'F');

      doc.setFillColor(212, 175, 55);
      doc.circle(W * 0.08, H * 0.10, W * 0.07, 'F');

      if (logoBase64) doc.addImage(logoBase64, 'PNG', W - 85, 5, 75, 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(70);
      doc.setTextColor(212, 175, 55);
      doc.text('CERTIFICADO', W / 2 + 40, 65, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(68, 68, 68);
      doc.text('Otorgado a', W / 2 + 40, 80, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(35);
      doc.setTextColor(0, 0, 0);
      doc.text(nombre, W / 2 + 30, 95, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(
        'Por haber participado con éxito en la capacitación que abarca los siguientes temas:',
        W / 2 + 35, 105, { align: 'center' }
      );
      doc.setFontSize(12);
      doc.text('• Derechos laborales de hombres y mujeres', W / 2 + 40, 115, { align: 'center' });
      doc.text('• Igualdad de género', W / 2 + 18, 125, { align: 'center' });
      doc.text('• Erradicación de la violencia y no discriminación', W / 2 + 44, 135, { align: 'center' });
      doc.text('• Otros relacionados para establecer el trabajo de igual valor', W / 2 + 55, 145, { align: 'center' });

      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      const fechaMostrar = pruebaEstatica?.ultima_fecha
        ? new Date(pruebaEstatica.ultima_fecha).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
        : 'Agosto 2026';
      doc.text(`Fecha: ${fechaMostrar}`, W / 2 + 105, 155, { align: 'center' });
      doc.text('Duración: 40 horas', W / 2 - 35, 155, { align: 'center' });

      doc.setDrawColor(20, 103, 129);
      doc.setLineWidth(0.8);
      doc.line(W / 2, H - 25, W / 2 + 85, H - 25);

      if (firmaBase64) doc.addImage(firmaBase64, 'PNG', W / 2 + 10, H - 58, 65, 32);
      doc.setFont('times', 'italic');
      doc.text('Abigail Cisneros', W / 2 + 40, H - 15, { align: 'center' });
      doc.text('JEFE DE TALENTO HUMANO', W / 2 + 40, H - 7, { align: 'center' });

      doc.save(`Certificado_TTHH_${nombre.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generando certificado TTHH:', error);
      Swal.fire('Error', 'No se pudo generar el certificado', 'error');
    }
  };

  /**
   * Marca un certificado como descargado en la BD
   * @param {string|number} certificadoId - ID del certificado
   */
  const marcarComoDescargado = async (certificadoId) => {
    try {
      await fetch(`${API_URL}/api/certificados/marcar-descargado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ certificadoId }),
      });
      await cargarCertificados(); // Recargar la lista
    } catch (error) {
      console.error('Error actualizando estado del certificado:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE MANEJO DE EVENTOS
  // ═══════════════════════════════════════════════════════════════

  const handleDescargarCertificado = async (cert) => {
    try {
      const nombreUsuario = perfil?.nombre || usuarioLocal.nombre || 'Usuario';
      const cedula = perfil?.cedula_identidad || usuarioLocal.cedula || '—';
      const cargo = perfil?.cargo || '—';

      // PASO 1: Obtener el certificado con sus firmas asociadas
      const resCert = await fetch(`${API_URL}/api/certificados/con-firmas/${cert.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resCert.ok) {
        throw new Error('No se pudo obtener el certificado');
      }

      const dataCert = await resCert.json();
      const certificadoConFirmas = dataCert?.data || dataCert || {};

      // PASO 2: Extraer las firmas del certificado
      let firmas = [];
      if (Array.isArray(certificadoConFirmas.firmas) && certificadoConFirmas.firmas.length > 0) {
        firmas = certificadoConFirmas.firmas.map((f) => ({
          nombre_admin: f.nombre_admin || 'Administrador',
          cargo: f.cargo || 'Cargo',
          imagen_firma_url: f.imagen_firma_url || '/img/firma.png',
        }));
      }

      // PASO 3: Generar el PDF con las firmas obtenidas
      await generarCertificadoGeneral(
        nombreUsuario,
        cedula,
        cargo,
        cert.nombre_curso,
        cert.calificacion,
        new Date(cert.fecha_emision).toLocaleDateString('es-EC', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        firmas,
        cert.id // ← ID del certificado para marcarlo como descargado
      );
    } catch (error) {
      console.error('Error descargando certificado:', error);
      Swal.fire('Error', 'No se pudo descargar el certificado. Intenta de nuevo.', 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════════════════════

  // Verificar si los 4 cursos estáticos están completados
  const losDerechos = completadosEstaticos.includes('derechos_laborales');
  const igualdad = completadosEstaticos.includes('igualdad_genero');
  const erradicacion = completadosEstaticos.includes('erradicacion_Violencia');
  const otros = completadosEstaticos.includes('otrosRelacionados');
  const todosCompletados = losDerechos && igualdad && erradicacion && otros && pruebaEstatica?.aprobado;

  // Certificado especial TTHH (si todos los 4 cursos están completados)
  const certificadoTTHH = todosCompletados
    ? {
        id: 'tthh-special',
        nombre_curso: 'Talento Humano - 4 Cursos',
        estado: 'emitido',
        calificacion: pruebaEstatica?.mejor_puntaje || 100,
        fecha_emision: new Date().toISOString(),
        codigo_certificado: `CERT-TTHH-${new Date().getTime()}`,
      }
    : null;

  // Combinar certificados
  const todosLosCertificados = certificadoTTHH ? [certificadoTTHH, ...certificados] : certificados;

  const certificadosFiltrados = todosLosCertificados.filter((cert) => {
    const coincideTexto = (cert.nombre_curso || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const coincideEstado =
      filtroEstado === 'todos' || cert.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="certificados-container">
      {/* ── ENCABEZADO ──────────────────────────────────────────── */}
      <div className="certificados-header">
        <div className="certificados-header__content">
          <Award size={32} />
          <div>
            <h1 className="certificados-header__title">Mis Certificados</h1>
            <p className="certificados-header__subtitle">
              Descarga los certificados de los cursos que has completado
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTROS (descomentar si se requiere) ───────────────────
      <div className="certificados-filtros">
        <div className="certificados-search-wrap">
          <Search size={16} className="certificados-search-icon" />
          <input
            type="text"
            className="certificados-search-input"
            placeholder="Buscar certificado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="certificados-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="emitido">Emitido</option>
          <option value="descargado">Descargado</option>
        </select>
      </div>
      */}

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────── */}
      <div className="certificados-content">
        {loading ? (
          <div className="certificados-loading">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p>Cargando certificados...</p>
          </div>
        ) : certificadosFiltrados.length === 0 ? (
          <div className="certificados-empty">
            <Award size={64} className="certificados-empty__icon" />
            <h3 className="certificados-empty__title">
              {certificados.length === 0
                ? 'No tienes certificados aún'
                : 'No se encontraron certificados'}
            </h3>
            <p className="certificados-empty__text">
              {certificados.length === 0
                ? 'Los certificados aparecerán aquí cuando completes y apruebes un curso que lo requiera.'
                : 'Ajusta tus filtros de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="certificados-grid">
            {certificadosFiltrados.map((cert, index) => (
              <div key={cert.id || index} className="certificado-card">
                <div className="certificado-card__body">
                  <h3 className="certificado-card__title">{cert.nombre_curso}</h3>

                  {cert.calificacion && (
                    <p className="certificado-card__info">
                      <strong>Calificación:</strong> {Number(cert.calificacion).toFixed(1)}%
                    </p>
                  )}

                  {/*
                  <p className="certificado-card__info">
                    <strong>Fecha:</strong>{' '}
                    {new Date(cert.fecha_emision).toLocaleDateString('es-EC', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  */}
                </div>

                <div className="certificado-card__footer">
                  <button
                    className="certificado-card__btn"
                    onClick={() =>
                      cert.id === 'tthh-special'
                        ? generarCertificadoTTHH()
                        : handleDescargarCertificado(cert)
                    }
                  >
                    <Download size={16} /> Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FUNCIÓN EXPORTABLE PARA GENERAR CERTIFICADO AUTOMÁTICAMENTE
 * ============================================================
 * Se llama desde los endpoints cuando un usuario completa un curso
 *
 * Uso en Backend (Node.js):
 *
 * import { generarCertificadoAutomatico } from 'certificado.jsx'
 *
 * if (curso.habilitar_certificado && usuarioAprobó) {
 *   await generarCertificadoAutomatico({
 *     idUsuario,
 *     idCurso,
 *     nombreUsuario,
 *     nombreCurso,
 *     calificacion,
 *     fechaCompletado
 *   });
 * }
 */
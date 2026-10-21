import jsPDF from 'jspdf';

const toBase64 = (url) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

/**
 * Genera y descarga el PDF de un certificado (mismo diseño que el de la vista del usuario).
 */
export async function descargarCertificadoPdf({
  nombreUsuario,
  //cedula,
  //cargo,
  nombreCurso,
  //calificacion,
  fecha,
  firmas = [],
  logo = '/img/safemedic.png',
}) {
  let logoBase64 = null;
  let firmasBase64 = [];

  try {
    logoBase64 = await toBase64(logo);
    firmasBase64 = await Promise.all(
      (firmas || []).map(async (firma) => ({
        nombre_admin: firma.nombre_admin || 'Administrador',
        cargo: firma.cargo || 'Cargo',
        imagen: firma.imagen_firma_url
          ? await toBase64(firma.imagen_firma_url).catch(() => null)
          : null,
      }))
    );
  } catch {
    console.warn('No se pudieron cargar las imágenes');
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(0, 184, 198);
  doc.triangle(0, H, W * 0.2, H, 0, H * 0.5, 'F');
  doc.setFillColor(13, 45, 62);
  doc.triangle(0, 0, W * 0.28, 0, 0, H - 60, 'F');
  doc.setFillColor(212, 175, 55);
  doc.circle(W * 0.08, H * 0.1, W * 0.07, 'F');

  if (logoBase64) doc.addImage(logoBase64, 'PNG', W - 85, 5, 75, 25);

  doc.setFont("garamond","bold");
  doc.setFontSize(70);
  doc.setTextColor(212, 175, 55);
  doc.text('CERTIFICADO', W / 2 + 40, 65, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(68, 68, 68);
  doc.text('Otorgado a', W / 2 + 40, 78, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(35);
  doc.setTextColor(0, 0, 0);
  doc.text(String(nombreUsuario || ''), W / 2 + 30, 95, { align: 'center' });

  /*
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(85, 85, 85);
  doc.text(`C.I.: ${cedula || ''}  |  Cargo: ${cargo || ''}`, W / 2 + 30, 96, { align: 'center' });
*/

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Por haber completado y aprobado satisfactoriamente la formación de:', W / 2 + 35, 108, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(13, 45, 62);
  const cursoLines = doc.splitTextToSize(nombreCurso || '', 170);
  doc.text(cursoLines, W / 2 + 35, 120, { align: 'center' });

  const nextY = 125 + cursoLines.length * 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  /*
  if (calificacion != null && !Number.isNaN(Number(calificacion))) {
    doc.text(`Calificación obtenida: ${Number(calificacion).toFixed(1)}%`, W / 2 - 20, nextY + 10, {
      align: 'center',
    });
  }*/
  doc.text(`Fecha: ${fecha}`, W / 2 + 100, nextY + 10, { align: 'center' });

  const n = firmasBase64.length;
  let positions = [];
  if (n === 1) {
    positions = [{ x: W / 2 + 10, y: H - 58 }];
  } else if (n === 2) {
    positions = [
      { x: W / 2 - 40, y: H - 58 },
      { x: W / 2 + 50, y: H - 58 },
    ];
  } else if (n >= 3) {
    positions = [
      { x: W / 2 - 90, y: H - 58 },
      { x: W / 2 - 10, y: H - 58 },
      { x: W / 2 + 70, y: H - 58 },
    ];
  }

  firmasBase64.forEach((firma, i) => {
    if (firma.imagen && positions[i]) {
      const pos = positions[i];
      doc.addImage(firma.imagen, 'PNG', pos.x, pos.y, 65, 32);
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(firma.nombre_admin, pos.x + 32.5, H - 15, { align: 'center' });
      doc.text(firma.cargo, pos.x + 32.5, H - 7, { align: 'center' });
    }
  });

  const nombreArchivo = `Certificado_${String(nombreUsuario).replace(/\s+/g, '_')}_${String(nombreCurso)
    .slice(0, 20)
    .replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}

import { useState, useEffect } from 'react';
import { User, Briefcase, Layers, BookOpen, CheckCircle, Clock, Search, History, Award } from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/pages/miPerfil.css';

export default function MiPerfil() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('user_token');
  const usuarioLocal = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');

  const [perfil, setPerfil] = useState(null);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProceso, setFiltroProceso] = useState('todos');
  const [vistaActiva, setVistaActiva] = useState('cursos'); // 'cursos' | 'historial' | 'prueba-tthh'
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [intentosTTHH, setIntentosTTHH] = useState([]);
  const [resumenTTHH, setResumenTTHH] = useState(null);
  const [cargandoTTHH, setCargandoTTHH] = useState(false);
  const [completadosEstaticos, setCompletadosEstaticos] = useState([]);
  const [pruebaEstatica, setPruebaEstatica] = useState(null);

  useEffect(() => {
    Promise.all([cargarPerfil(), cargarCapacitaciones(), cargarEstaticosYPrueba()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const cargarCapacitaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inscripciones/mis-capacitaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCapacitaciones(data.data || []);
      } else {
        throw new Error(data.message || 'Error al cargar capacitaciones');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar las capacitaciones', 'error');
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

  const cargarHistorial = async () => {
    const userId = perfil?.id || usuarioLocal.id;
    if (!userId) return;
    setCargandoHistorial(true);
    try {
      const res = await fetch(`${API_URL}/api/version-cursos/historial-usuario/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setHistorial(data.data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCambiarVista = (vista) => {
    setVistaActiva(vista);
    if (vista === 'historial' && historial.length === 0) cargarHistorial();
    if (vista === 'prueba-tthh' && !resumenTTHH) cargarIntentosTTHH();
  };

  const cargarIntentosTTHH = async () => {
    const nombre = perfil?.nombre || usuarioLocal.nombre;
    if (!nombre) return;
    setCargandoTTHH(true);
    try {
      const res = await fetch(
        `${API_URL}/api/resultados/mis-intentos/Talento Humano?nombre=${encodeURIComponent(nombre)}`
      );
      const data = await res.json();
      if (data.ok) {
        setIntentosTTHH(data.intentos || []);
        setResumenTTHH({ mejor_puntaje: data.mejor_puntaje, aprobado: data.aprobado });
      }
    } catch (err) {
      console.error('Error cargando resultados TTHH:', err);
    } finally {
      setCargandoTTHH(false);
    }
  };


  // Cursos estáticos TTHH como filas de tabla
  const cursosEstaticosConfig = [
    { id: 'e1', curso_nombre: '1. Reglamento Interno de Trabajo - Código de Ética - Política de Responsabilidad Social', dbName: 'reglamentoInterno', esReglamento: true },
    { id: 'e2', curso_nombre: '2. Derechos laborales de mujeres y hombres', dbName: 'derechos_laborales' },
    { id: 'e3', curso_nombre: '3. Igualdad de género', dbName: 'igualdad_genero' },
    { id: 'e4', curso_nombre: '4. Erradicación de violencia y no discriminación en un centro de trabajo', dbName: 'erradicacion_Violencia' },
    { id: 'e5', curso_nombre: '5. Otros relacionados para establecer el trabajo de igual valor', dbName: 'otrosRelacionados' },
  ];

  const cursosEstaticosItems = cursosEstaticosConfig.map(c => {
    const completado = completadosEstaticos.includes(c.dbName);
    const puntaje = c.esReglamento
      ? (completado ? 100 : null)
      : (pruebaEstatica ? pruebaEstatica.mejor_puntaje : null);
    const aprobado = c.esReglamento
      ? (completado ? true : null)
      : (pruebaEstatica ? pruebaEstatica.aprobado : null);
    return { id: c.id, curso_nombre: c.curso_nombre, proceso: 'Talento Humano', mejor_puntaje: puntaje, evaluacion_aprobada: aprobado, es_estatico: true, excluir_de_stats: !!c.esReglamento };
  });

  const todasCapacitaciones = [...capacitaciones, ...cursosEstaticosItems];

  // Lista única de procesos para el filtro
  const procesosUnicos = ['todos', ...new Set(todasCapacitaciones.map(c => c.proceso).filter(Boolean))];

  // e1 (Reglamento) excluido de los contadores generales
  const cursosContables = todasCapacitaciones.filter(c => !c.excluir_de_stats);
  const total = cursosContables.length;
  const completadas = cursosContables.filter(c => c.mejor_puntaje !== null && c.mejor_puntaje !== undefined).length;
  const aprobadas = cursosContables.filter(c => c.evaluacion_aprobada).length;
  const pendientes = total - completadas;

  // Filtros combinados
  const capacitacionesFiltradas = todasCapacitaciones.filter(c => {
    const coincideTexto = (c.curso_nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const tieneNota = c.mejor_puntaje !== null && c.mejor_puntaje !== undefined;
    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'completado' && tieneNota) ||
      (filtroEstado === 'pendiente' && !tieneNota);
    const coincideProceso =
      filtroProceso === 'todos' || c.proceso === filtroProceso;
    return coincideTexto && coincideEstado && coincideProceso;
  });

  const nombre = perfil?.nombre || usuarioLocal.nombre || 'Usuario';
  const cedula = perfil?.cedula_identidad || usuarioLocal.cedula || '—';
  const proceso = perfil?.proceso || '—';
  const cargo = perfil?.cargo || '—';

  const generarCertificadoCurso = async (cap) => {
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
    } catch { /* imágenes opcionales */ }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Fondo
    doc.setFillColor('#00b8c6');
    doc.triangle(0, H, W * 0.40, H, 0, H * 0.5, 'F');
    doc.setFillColor('#0d2d3e');
    doc.triangle(0, 0, W * 0.28, 0, 0, H - 60, 'F');
    doc.setFillColor('#d4af37');
    doc.circle(W * 0.08, H * 0.10, W * 0.07, 'F');

    if (logoBase64) doc.addImage(logoBase64, 'PNG', W - 85, 5, 75, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.setTextColor('#d4af37');
    doc.text('CERTIFICADO', W / 2 + 40, 58, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor('#444444');
    doc.text('Otorgado a', W / 2 + 40, 72, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(30);
    doc.setTextColor('#000000');
    doc.text(nombre, W / 2 + 30, 87, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#555555');
    doc.text(`C.I.: ${cedula}  |  Cargo: ${cargo}`, W / 2 + 30, 96, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor('#000000');
    doc.text('Por haber completado y aprobado satisfactoriamente la capacitación:', W / 2 + 35, 108, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor('#0d2d3e');
    const cursoLines = doc.splitTextToSize(cap.curso_nombre, 170);
    doc.text(cursoLines, W / 2 + 35, 120, { align: 'center' });

    const nextY = 120 + cursoLines.length * 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor('#000000');
    if (cap.mejor_puntaje != null) {
      doc.text(`Calificación obtenida: ${Number(cap.mejor_puntaje).toFixed(1)}%`, W / 2 - 20, nextY + 10, { align: 'center' });
    }
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}`, W / 2 + 100, nextY + 10, { align: 'center' });

    doc.setDrawColor('#146781');
    doc.setLineWidth(0.8);
    doc.line(W / 2, H - 25, W / 2 + 85, H - 25);

    if (firmaBase64) doc.addImage(firmaBase64, 'PNG', W / 2 + 10, H - 58, 65, 32);
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor('#000000');
    doc.text('Abigail Cisneros', W / 2 + 40, H - 15, { align: 'center' });
    doc.text('JEFE DE TALENTO HUMANO', W / 2 + 40, H - 7, { align: 'center' });

    doc.save(`Certificado_${nombre.replace(/\s+/g, '_')}_${cap.curso_nombre.slice(0, 30).replace(/\s+/g, '_')}.pdf`);
  };

  // Certificado TTHH idéntico al de ResultadosPruebaTTHH (mismos temas y diseño)
  const generarCertificadoTTHH = async () => {
    const toBase64 = (url) =>
      fetch(url).then((r) => r.blob()).then(
        (blob) => new Promise((resolve, reject) => {
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
    } catch { /* imágenes opcionales */ }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    doc.setFillColor('#00b8c6');
    doc.triangle(0, H, W * 0.40, H, 0, H * 0.5, 'F');
    doc.setFillColor('#0d2d3e');
    doc.triangle(0, 0, W * 0.28, 0, W * 0, H - 60, 'F');
    doc.setFillColor('#d4af37');
    doc.circle(W * 0.08, H * 0.10, W * 0.07, 'F');

    if (logoBase64) doc.addImage(logoBase64, 'PNG', W - 85, 5, 75, 25);

    doc.setFont('garamond', 'bold');
    doc.setFontSize(70);
    doc.setTextColor('#d4af37');
    doc.text('CERTIFICADO', W / 2 + 40, 65, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor('#444444');
    doc.text('Otorgado a', W / 2 + 40, 80, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(35);
    doc.setTextColor('#000000');
    doc.text(nombre, W / 2 + 30, 95, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor('#000000');
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
    doc.setTextColor('#000000');
    const fechaMostrar = pruebaEstatica?.ultima_fecha
      ? new Date(pruebaEstatica.ultima_fecha).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
      : 'Agosto 2026';
    doc.text(`Fecha: ${fechaMostrar}`, W / 2 + 105, 155, { align: 'center' });
    doc.text('Duración: 40 horas', W / 2 - 35, 155, { align: 'center' });

    doc.setDrawColor('#146781');
    doc.setLineWidth(0.8);
    doc.line(W / 2, H - 25, W / 2 + 85, H - 25);

    if (firmaBase64) doc.addImage(firmaBase64, 'PNG', W / 2 + 10, H - 58, 65, 32);
    doc.setFont('times', 'italic');
    doc.text('Abigail Cisneros', W / 2 + 40, H - 15, { align: 'center' });
    doc.text('JEFE DE TALENTO HUMANO', W / 2 + 40, H - 7, { align: 'center' });

    doc.save(`Certificado_TTHH_${nombre.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="perfil-layout">

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="perfil-sidebar">
        <div className="perfil-sidebar__avatar">
          <User size={44} />
        </div>

        <h2 className="perfil-sidebar__nombre">{nombre}</h2>
        <p className="perfil-sidebar__cedula">CI: {cedula}</p>

        <div className="perfil-sidebar__divider" />

        <div className="perfil-sidebar__item">
          <Layers size={16} className="perfil-sidebar__icon" />
          <div>
            <span className="perfil-sidebar__label">Proceso</span>
            <span className="perfil-sidebar__value">{proceso}</span>
          </div>
        </div>

        <div className="perfil-sidebar__item">
          <Briefcase size={16} className="perfil-sidebar__icon" />
          <div>
            <span className="perfil-sidebar__label">Cargo</span>
            <span className="perfil-sidebar__value">{cargo}</span>
          </div>
        </div>

        <div className="perfil-sidebar__divider" />

        {/* Resumen de cursos */}
        <div className="perfil-sidebar__stats">
          <div className="perfil-sidebar__stat">
            <BookOpen size={18} />
            <span className="perfil-sidebar__stat-num">{total}</span>
            <span className="perfil-sidebar__stat-label">Asignados</span>
          </div>
          <div className="perfil-sidebar__stat perfil-sidebar__stat--green">
            <CheckCircle size={18} />
            <span className="perfil-sidebar__stat-num">{completadas}</span>
            <span className="perfil-sidebar__stat-label">Completados</span>
          </div>
          <div className="perfil-sidebar__stat perfil-sidebar__stat--blue">
            <CheckCircle size={18} />
            <span className="perfil-sidebar__stat-num">{aprobadas}</span>
            <span className="perfil-sidebar__stat-label">Aprobados</span>
          </div>
          <div className="perfil-sidebar__stat perfil-sidebar__stat--orange">
            <Clock size={18} />
            <span className="perfil-sidebar__stat-num">{pendientes}</span>
            <span className="perfil-sidebar__stat-label">Pendientes</span>
          </div>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────── */}
      <main className="perfil-main">

        <div className="perfil-main__header">
          <div className="perfil-main__tabs">
            <button
              className={`perfil-tab-btn${vistaActiva === 'cursos' ? ' activo' : ''}`}
              onClick={() => handleCambiarVista('cursos')}
            >
              <BookOpen size={16} /> Mis Capacitaciones
            </button>
            <button
              className={`perfil-tab-btn${vistaActiva === 'historial' ? ' activo' : ''}`}
              onClick={() => handleCambiarVista('historial')}
            >
              <History size={16} /> Historial por Año
            </button>
            <button
              className={`perfil-tab-btn${vistaActiva === 'certificados' ? ' activo' : ''}`}
              onClick={() => handleCambiarVista('certificados')}
            >
              <Award size={16} /> Certificados
            </button>
            
          </div>
        </div>

        {/* ── Vista: Cursos actuales ─────────────────────────────── */}
        {vistaActiva === 'cursos' && (<>
        <div className="perfil-filtros">
          <div className="perfil-search-wrap">
            <Search size={16} className="perfil-search-icon" />
            <input
              type="text"
              className="perfil-search-input"
              placeholder="Buscar capacitación..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="perfil-select"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Sin completar</option>
            <option value="completado">Completado</option>
          </select>

          <select
            className="perfil-select"
            value={filtroProceso}
            onChange={e => setFiltroProceso(e.target.value)}
          >
            {procesosUnicos.map(p => (
              <option key={p} value={p}>{p === 'todos' ? 'Todos los procesos' : p}</option>
            ))}
          </select>
        </div>

        {/* ── Tabla ──────────────────────────────────────────────── */}
        <div className="tabla-cursos">
          <table className="tabla-cursos-principal">
            <thead className="table-d">
              <tr>
                <th>CURSO</th>
                <th>PROCESO</th>
                <th>ESTADO</th>
                <th>CALIFICACIÓN</th>
                <th>RESULTADO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : capacitaciones.length === 0 && cursosEstaticosItems.every(c => c.mejor_puntaje === null) ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="alert alert-warning text-center mt-4">
                      <h5>No tienes capacitaciones asignadas</h5>
                      <p className="mb-0">Contacta a tu administrador para que te asigne capacitaciones.</p>
                    </div>
                  </td>
                </tr>
              ) : capacitacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="alert alert-secondary text-center mt-4">
                      No hay capacitaciones que coincidan con los filtros aplicados.
                    </div>
                  </td>
                </tr>
              ) : (
                capacitacionesFiltradas.map(cap => {
                  const tieneNota = cap.mejor_puntaje !== null && cap.mejor_puntaje !== undefined;
                  const estadoColor = tieneNota ? 'success' : 'secondary';
                  const estadoTexto = tieneNota ? 'Completado' : 'Sin Completar';

                  return (
                    <tr key={cap.id}>
                      <td><strong>{cap.curso_nombre}</strong></td>
                      <td>{cap.proceso}</td>
                      <td>
                        <span className={`badge bg-${estadoColor}`}>{estadoTexto}</span>
                      </td>
                      <td>
                        {tieneNota ? (
                          <span style={{ color: cap.evaluacion_aprobada ? '#198754' : '#dc3545', fontWeight: 600, fontSize: '13px' }}>
                            {Number(cap.mejor_puntaje).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {tieneNota && (
                          <span className={`badge ${cap.evaluacion_aprobada ? 'bg-success' : 'bg-danger'}`} style={{ color: '#fff' }}>
                            {cap.evaluacion_aprobada ? 'Aprobado' : 'Reprobado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </>) /* fin vista cursos */}

        {/* ── Vista: Historial por año ──────────────────────────── */}
        {vistaActiva === 'historial' && (
          <div className="perfil-historial">
            {cargandoHistorial ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : historial.length === 0 ? (
              <div className="alert alert-info">No hay historial de capacitaciones registrado.</div>
            ) : (
              historial.map(grupo => (
                <div key={grupo.curso_base_id} className="historial-grupo">
                  <div className="historial-grupo__header">
                    <BookOpen size={16} />
                    <span>{grupo.curso_nombre}</span>
                    <span className="historial-grupo__proceso">{grupo.proceso}</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Año</th>
                          <th>Estado</th>
                          <th className="text-center">Módulos</th>
                          <th className="text-center">Calificación</th>
                          <th className="text-center">Resultado</th>
                          <th>Finalizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.versiones.map(v => (
                          <tr key={v.inscripcion_id}>
                            <td><strong>{v.anio}</strong></td>
                            <td>
                              <span className={`badge ${
                                v.estado === 'completado' ? 'bg-success' :
                                v.estado === 'en progreso' ? 'bg-primary' : 'bg-secondary'
                              }`}>{v.estado}</span>
                            </td>
                            <td className="text-center">
                              {v.modulos_completados}/{v.total_modulos}
                            </td>
                            <td className="text-center fw-semibold" style={{
                              color: v.evaluacion_aprobada ? '#198754' :
                                     v.mejor_puntaje != null ? '#dc3545' : '#6c757d'
                            }}>
                              {v.mejor_puntaje != null ? `${Number(v.mejor_puntaje).toFixed(1)}%` : '—'}
                            </td>
                            <td className="text-center">
                              {v.evaluacion_aprobada != null ? (
                                <span className={`badge ${v.evaluacion_aprobada ? 'bg-success' : 'bg-danger'}`}>
                                  {v.evaluacion_aprobada ? 'Aprobado' : 'Reprobado'}
                                </span>
                              ) : <span className="text-muted">—</span>}
                            </td>
                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                              {v.fin_en ? new Date(v.fin_en).toLocaleDateString('es-ES') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Vista: Prueba Final TTHH ──────────────────────────── */}
        {vistaActiva === 'prueba-tthh' && (
          <div className="perfil-historial">
            {cargandoTTHH ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : !resumenTTHH || intentosTTHH.length === 0 ? (
              <div className="alert alert-info">
                Aún no has realizado la prueba final de Talento Humano.
              </div>
            ) : (
              <>
                {/* Resumen */}
                <div className={`alert ${resumenTTHH.aprobado ? 'alert-success' : 'alert-warning'} d-flex align-items-center gap-3 mb-4`}>
                  <Award size={32} />
                  <div>
                    <strong>Mejor puntaje:</strong> {resumenTTHH.mejor_puntaje}% &nbsp;|&nbsp;
                    <strong>Estado:</strong>{' '}
                    <span className={`badge ${resumenTTHH.aprobado ? 'bg-success' : 'bg-danger'}`}>
                      {resumenTTHH.aprobado ? 'Aprobado' : 'No aprobado aún'}
                    </span>
                    &nbsp;|&nbsp;
                    <strong>Intentos realizados:</strong> {intentosTTHH.length}
                  </div>
                </div>

                {/* Historial de intentos */}
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Puntaje</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intentosTTHH.map((intento, idx) => (
                        <tr key={intento.id}>
                          <td>{intentosTTHH.length - idx}</td>
                          <td>
                            {intento.fecha_registro
                              ? new Date(intento.fecha_registro).toLocaleDateString('es-EC', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td>
                            <span className={`fw-bold ${intento.puntaje >= 70 ? 'text-success' : 'text-danger'}`}>
                              {intento.puntaje}%
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${intento.aprobado ? 'bg-success' : 'bg-danger'}`}>
                              {intento.aprobado ? 'Aprobado' : 'Reprobado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Vista: Certificados ──────────────────────────────── */}
        {vistaActiva === 'certificados' && (() => {
          const TTHH_REQUERIDOS = ['derechos_laborales', 'igualdad_genero', 'erradicacion_Violencia', 'otrosRelacionados'];
          const puedeDescargarTTHH =
            pruebaEstatica?.aprobado &&
            TTHH_REQUERIDOS.every(dbName => completadosEstaticos.includes(dbName));
          // solo cursos dinámicos aprobados (los estáticos se agrupan en la fila TTHH)
          const cursosAprobadosDinamicos = todasCapacitaciones.filter(
            c => c.evaluacion_aprobada === true && !c.es_estatico
          );
          const sinCertificados = !puedeDescargarTTHH && cursosAprobadosDinamicos.length === 0;
          return (
            <div className="tabla-cursos mt-3">
              {sinCertificados ? (
                <div className="alert alert-info">
                  Aún no tienes certificados disponibles. Completa los 4 temas TTHH y aprueba la prueba final, o aprueba una capacitación dinámica.
                </div>
              ) : (
                <table className="tabla-cursos-principal">
                  <thead className="table-d">
                    <tr>
                      <th>CURSO / PROGRAMA</th>
                      <th>PROCESO</th>
                      <th>ESTADO</th>
                      <th>CALIFICACIÓN</th>
                      <th>CERTIFICADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fila única para el programa TTHH completo */}
                    {puedeDescargarTTHH && (
                      <tr>
                        <td><strong>Programa: Igualdad, No Discriminación y Erradicación de Violencia – Talento Humano</strong></td>
                        <td>Talento Humano</td>
                        <td>
                          <span className="badge bg-success me-1">Completado</span>
                          <span className="badge bg-primary">Aprobado</span>
                        </td>
                        <td>
                          <span style={{ color: '#198754', fontWeight: 600, fontSize: '13px' }}>
                            {pruebaEstatica?.mejor_puntaje != null ? `${Number(pruebaEstatica.mejor_puntaje).toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            title="Descargar certificado TTHH"
                            onClick={generarCertificadoTTHH}
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>
                            Descargar
                          </button>
                        </td>
                      </tr>
                    )}
                    {/* Certificados individuales de cursos dinámicos */}
                    {cursosAprobadosDinamicos.map(cap => (
                      <tr key={cap.id}>
                        <td><strong>{cap.curso_nombre}</strong></td>
                        <td>{cap.proceso || '—'}</td>
                        <td>
                          <span className="badge bg-success me-1">Completado</span>
                          <span className="badge bg-primary">Aprobado</span>
                        </td>
                        <td>
                          <span style={{ color: '#198754', fontWeight: 600, fontSize: '13px' }}>
                            {cap.mejor_puntaje != null ? `${Number(cap.mejor_puntaje).toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            title="Descargar certificado PDF"
                            onClick={() => generarCertificadoCurso(cap)}
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>
                            Descargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })()}

      </main>
    </div>
  );
}

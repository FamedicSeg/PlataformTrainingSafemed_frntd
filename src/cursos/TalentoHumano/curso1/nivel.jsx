import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SalaJitsiMeet from "../../../components/SalaJitsiMeet";
import "../../../styles/components/nivel.css";

export default function Nivel({
  nivel,
  puedeAcceder,
  marcarCompletado,
  onJoinConference,
  conferenceLoading = false,
  conferenceAttended = false
}) {
  const _location = useLocation();
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // La conferencia expira al pasar su fecha de fin; se revisa cada 30 s
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    if (nivel.tipo !== 'video_conferencia' || !nivel.fecha_fin_conferencia) return;
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, [nivel.tipo, nivel.fecha_fin_conferencia]);
  const conferenciaExpirada = nivel.tipo === 'video_conferencia'
    && !!nivel.fecha_fin_conferencia
    && ahora > new Date(nivel.fecha_fin_conferencia);
  // ✅ UTILIDADES
  const isOneDriveUrl = (url) => {
    if (!url) return false;
    return /sharepoint|onedrive|1drv\.ms|microsoftstream/i.test(url);
  };

  const isCloudinaryUrl = (url) => {
    if (!url) return false;
    return /cloudinary|res\.cloudinary/i.test(url);
  };

  const isSupabaseUrl = (url) => {
    if (!url) return false;
    return url.includes('supabase.co') || url.includes('storage/v1/object/public');
  };

  const getProxyUrl = (fileUrl) => {
    if (!fileUrl || !isOneDriveUrl(fileUrl)) return fileUrl;
    try {
      const encodedUrl = encodeURIComponent(fileUrl);
      return `${API_URL}/api/proxy/stream?url=${encodedUrl}`;
    } catch (error) {
      console.error('Error creando URL proxy:', error);
      return fileUrl;
    }
  };

  // FUNCIÓN PARA MARCAR/DESMARCAR
  const handleCardClick = (e) => {
    if (
      e.target.tagName === 'BUTTON' || 
      e.target.tagName === 'A' ||
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.tagName === 'VIDEO' ||
      e.target.tagName === 'IFRAME' ||
      e.target.closest('.modal')
    ) {
      return;
    }
    if (puedeAcceder && nivel.tipo !== 'video_conferencia') {
      marcarCompletado(nivel.id);
    }
  };

  // DETECTAR FIN DEL VIDEO MP4
  useEffect(() => {
    if (!nivel || nivel.tipo !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    const handleEnd = () => {
      if (!nivel.completado) marcarCompletado(nivel.id);
    };
    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, [nivel, marcarCompletado]);

  // DETECTAR FIN DE VIDEO YOUTUBE
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(nivel?.url);

  useEffect(() => {
    if (!youtubeId) return;
    const listener = (event) => {
      if (!event.origin.includes("youtube.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange" && data.info === 0) {
          if (!nivel.completado) marcarCompletado(nivel.id);
        }
      } catch (err) {
        console.log("YouTube error:", err);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [youtubeId, nivel, marcarCompletado]);

  // ✅ VALIDACIÓN
  if (!nivel) {
    return (
      <div className="card shadow-sm mb-4 border-danger">
        <div className="card-body text-center text-danger">
          <p className="mb-0">❌ Error: Contenido del módulo no disponible</p>
        </div>
      </div>
    );
  }

  // RENDER
  return (
    <div 
      className={`card shadow-sm mb-4 ${nivel.completado ? "nivel-completado" : ""}`}
      onClick={handleCardClick}
      style={{
        cursor: puedeAcceder ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        border: puedeAcceder && !nivel.completado ? '2px solid #007bff' : '2px solid #dee2e6'
      }}
    >
      <div className="card-body">
        {/* TÍTULO Y ESTADO */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title text-primary">{nivel.titulo || 'Módulo sin título'}</h5>
          {nivel.tipo !== 'video_conferencia' && (
            <span className={`badge ${nivel.completado ? 'bg-success' : 'bg-secondary'}`}>
              {nivel.completado ? '✅ Completado' : '⭕ Pendiente'}
            </span>
          )}
        </div>

        {nivel.descripcion && <p className="text-muted mb-2">{nivel.descripcion}</p>}
        {nivel.autor && <p className="text-muted mb-3">{nivel.autor}</p>}

        {/* 🎬 VIDEO */}
        {nivel.tipo === "video" && (
          <>
            {youtubeId ? (
              <div className="ratio ratio-16x9 mb-3">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
                  title={nivel.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : isCloudinaryUrl(nivel.url) ? (
              <div className="mb-3">
                <div className="alert alert-success mb-2">
                  <i className="bi bi-cloud-check me-2"></i> Video optimizado de Cloudinary
                </div>
                <video
                  ref={videoRef}
                  controls
                  src={nivel.url}
                  className="w-100 rounded"
                  style={{ width: "100%", maxWidth: "1200px", height: "550px", borderRadius: "10px", objectFit: "contain" }}
                  onEnded={() => { if (!nivel.completado) marcarCompletado(nivel.id); }}
                />
              </div>
            ) : isSupabaseUrl(nivel.url) ? (
              <div className="mb-3">
                <div className="alert alert-primary mb-2">
                  <i className="bi bi-database me-2"></i> Observa con atención el siguiente video 
                </div>
                <video
                  ref={videoRef}
                  controls
                  src={nivel.url}
                  className="w-100 rounded"
                  style={{ width: "100%", maxWidth: "1200px", height: "550px", borderRadius: "10px", objectFit: "contain" }}
                  onEnded={() => { if (!nivel.completado) marcarCompletado(nivel.id); }}
                />
              </div>
            ) : isOneDriveUrl(nivel.url) ? (
              <div className="mb-3">
                <div className="alert alert-info mb-2">
                  <i className="bi bi-cloud-check me-2"></i> Video alojado en OneDrive
                </div>
                <video
                  ref={videoRef}
                  controls
                  src={getProxyUrl(nivel.url)}
                  className="w-100 rounded"
                  style={{ width: "100%", maxWidth: "1200px", height: "550px", borderRadius: "10px", objectFit: "contain" }}
                  crossOrigin="anonymous"
                  onEnded={() => { if (!nivel.completado) marcarCompletado(nivel.id); }}
                />
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                src={nivel.url}
                className="w-100 rounded mb-3"
                style={{ width: "100%", maxWidth: "1200px", height: "550px", borderRadius: "10px", objectFit: "contain" }}
                onEnded={() => { if (!nivel.completado) marcarCompletado(nivel.id); }}
              />
            )}
          </>
        )}

        {/* 📄 PDF */}
        {nivel.tipo === "pdf" && (
        <div className="mb-3">
          <div className="alert alert-secondary mb-2">
            <i className="bi bi-file-earmark-pdf me-2"></i>
              Abre y visualiza el Documento PDF
          </div>
    
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              window.open(nivel.url, '_blank');
              if (!nivel.completado) marcarCompletado(nivel.id);
            }}
          >
            <i className="bi bi-eye me-2"></i> Visualizar PDF
          </button>
        </div>
    
        <div className="mt-2">
          <small className="text-muted">
            💡 El documento se abrirá en una nueva ventana para mejor visualización
          </small>
        </div>
      </div>
      )}

        {/* 📊 EXCEL - Botón "Visualizar Excel" */}
        {nivel.tipo === "excel" && (
          <div className="mb-3">
            <div className="alert alert-success mb-2">
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              Abre y visualiza el Documento Excel
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-success"
                style={{ fontSize: '15px', width: '200px', height: '45px', marginTop: '10px', fontWeight: 'bold' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(nivel.url)}`;
                  window.open(viewerUrl, '_blank', 'width=1200,height=800');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-eye me-2"></i> Visualizar Excel
              </button>
              
              <button
                className="btn btn-outline-secondary"
                style={{ fontSize: '15px', width: '200px', height: '45px', marginTop: '10px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(nivel.url, '_blank');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-box-arrow-up-right me-2"></i> Descargar original
              </button>
            </div>
            
            <div className="mt-2">
              <small className="text-muted">
                💡 El documento se abrirá en una nueva ventana para mejor visualización
              </small>
            </div>
          </div>
        )}

        {/* 📝 WORD - Botón "Visualizar Word" */}
        {(nivel.tipo === "word" || nivel.tipo === "docx") && (
          <div className="mb-3">
            <div className="alert alert-primary mb-2">
              <i className="bi bi-file-earmark-word me-2"></i>
              Abre y visualiza el Documento Word
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', width: '200px', height: '45px', marginTop: '10px', padding: '0.5rem 1rem', fontSize: '15px', fontWeight: 'bold' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(nivel.url)}`;
                  window.open(viewerUrl, '_blank', 'width=1200,height=800');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-eye me-2"></i> Visualizar Word
              </button>
              
              <button
                className="btn btn-outline-secondary"
                style={{ fontSize: '15px', width: '200px', height: '45px', marginTop: '10px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(nivel.url, '_blank');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-box-arrow-up-right me-2"></i> Descargar original
              </button>
            </div>
            
            <div className="mt-2">
              <small className="text-muted">
                💡 El documento se abrirá en una nueva ventana para mejor visualización
              </small>
            </div>
          </div>
        )}

        {/* 📊 POWERPOINT - Botón "Visualizar PPT" */}
        {(nivel.tipo === "powerpoint" || nivel.tipo === "pptx") && (
          <div className="mb-3">
            <div className="alert alert-warning mb-2">
              <i className="bi bi-file-earmark-slides me-2"></i>
              Abre y visualiza la Presentación PowerPoint
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-warning"
                style={{ textTransform: 'none', width: '200px', height: '45px', marginTop: '10px', fontSize: '15px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(nivel.url)}`;
                  window.open(viewerUrl, '_blank', 'width=1200,height=800');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-eye me-2"></i> Visualizar PPT
              </button>
              
              <button
                className="btn btn-outline-secondary"
                style={{ textTransform: 'none', width: '200px', height: '45px', marginTop: '10px', fontSize: '15px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(nivel.url, '_blank');
                  if (!nivel.completado) marcarCompletado(nivel.id);
                }}
              >
                <i className="bi bi-box-arrow-up-right me-2"></i> Descargar original
              </button>
            </div>
            
            <div className="mt-2">
              <small className="text-muted">
                💡 La presentación se abrirá en una nueva ventana para mejor visualización
              </small>
            </div>
          </div>
        )}

        {nivel.tipo === "video_conferencia" && (
          <div className="modulo-conferencia" onClick={(e) => e.stopPropagation()}>
            <div className="conferencia-titulo">
              <strong>Videoconferencia en vivo</strong>
            </div>
            <div className="conferencia-fechas">
              <div className="conferencia-fecha-inicio">
                Inicio: {nivel.fecha_inicio_conferencia
                  ? new Date(nivel.fecha_inicio_conferencia).toLocaleString('es-EC')
                  : 'No especificado'}
              </div>
              <div className="conferencia-fecha-fin">
                Fin: {nivel.fecha_fin_conferencia
                  ? new Date(nivel.fecha_fin_conferencia).toLocaleString('es-EC')
                  : 'No especificado'}
              </div>
            </div>
            
            {conferenciaExpirada ? (
              <div className="alert alert-danger mb-0">
                <i className="bi bi-calendar-x me-2"></i>
                <strong>La reunión está expirada.</strong> Ya no es posible unirse a esta videoconferencia.
              </div>
            ) : puedeAcceder ? (
              <SalaJitsiMeet 
                moduloId={nivel.modulo_id}
                nombreModulo={nivel.titulo}
                userEmail={localStorage.getItem('user_email') || 'participante@safemedec.com'}
                userName={JSON.parse(localStorage.getItem('usuario_logueado') || '{}').nombre || 'Participante'}
                onCerrar={() => {}}
                fechaInicio={nivel.fecha_inicio_conferencia}
                isFloating={false}
              />
            ) : (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No tienes permiso para acceder a esta videoconferencia
              </div>
            )}
          </div>
        )}

        {/* 📝 TEXTO */}
        {nivel.tipo === "texto" && (
          <div className="alert alert-secondary" onClick={(e) => e.stopPropagation()}>
            {nivel.contenido || 'Sin contenido'}
          </div>
        )}

        {/* 🖼️ IMAGEN */}
        {nivel.tipo === "imagen" && (
          <>
            <button
              className="btn btn-outline-primary me-2"
              data-bs-toggle="modal"
              data-bs-target={`#modalImagen${nivel.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!nivel.completado) marcarCompletado(nivel.id);
              }}
            >
              <i className="bi bi-image me-2"></i> Ver Imagen
            </button>
            <div className="modal fade" id={`modalImagen${nivel.id}`} tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{nivel.titulo}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div className="modal-body text-center">
                    <img src={nivel.url} alt="Infografía" className="img-fluid rounded" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🔽 BOTÓN MANUAL */}
        {nivel.tipo !== "video_conferencia" && (
          <button
            className={`btn ${nivel.completado ? "btn-outline-success" : "btn-outline-primary"} w-100 mt-2`}
            onClick={(e) => {
              e.stopPropagation();
              marcarCompletado(nivel.id);
            }}
            disabled={!puedeAcceder}
          >
            {nivel.completado ? "🔄 Desmarcar" : "Marcar como completado"}
          </button>
        )}
      </div>
    </div>
  );
}
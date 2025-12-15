import { useEffect, useRef } from "react";
import { Link , useLocation} from "react-router-dom";

export default function Nivel({ nivel, puedeAcceder, marcarCompletado }) {
  const _location = useLocation();
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  // FUNCIÓN PARA MARCAR/DESMARCAR AL HACER CLICK EN LA CARD
  const handleCardClick = (e) => {
    // Prevenir que se active cuando se hace click en elementos interactivos
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

    if (puedeAcceder) {
      marcarCompletado(nivel.id);
    }
  };

  // DETECTAR FIN DEL VIDEO MP4
  useEffect(() => {
    if (nivel.tipo !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    const handleEnd = () => {
      if (!nivel.completado) marcarCompletado(nivel.id);
    };

    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, [nivel.id, nivel.tipo, marcarCompletado, nivel.completado]);

  // DETECTAR FIN DE VIDEO YOUTUBE
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(nivel.url);

  useEffect(() => {
    if (!youtubeId) return;

    const listener = (event) => {
      if (!event.origin.includes("youtube.com")) return;

      try {
        const data = JSON.parse(event.data);
        // 0 = ended
        if (data.event === "onStateChange" && data.info === 0) {
          if (!nivel.completado) marcarCompletado(nivel.id);
        }
      } catch (err) {
        console.log("YouTube error:", err);
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [youtubeId, nivel.id, marcarCompletado, nivel.completado]);

  // RENDER
  return (
    <div 
      className={`card shadow-sm mb-4 ${nivel.completado ? "nivel-completado" : ""} ${puedeAcceder ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={handleCardClick}
      style={{
        cursor: puedeAcceder ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        border: puedeAcceder && !nivel.completado ? '2px solid #007bff' : '2px solid #dee2e6'
      }}
      onMouseEnter={(e) => {
        if (puedeAcceder) {
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (puedeAcceder) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div className="card-body">
        {/* Indicador visual de estado */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title text-primary">{nivel.titulo}</h5>
          <span className={`badge ${nivel.completado ? 'bg-success' : 'bg-secondary'}`}>
            {nivel.completado ? '✅ Completado' : '⭕ Pendiente'}
          </span>
        </div>

        {nivel.descripcion && <p className="text-muted mb-2">{nivel.descripcion}</p>}
        {nivel.autor && <p className="text-muted mb-3">{nivel.autor}</p>}

        {/* VIDEO MP4 O YOUTUBE */}
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
            ) : (
              <video
                ref={videoRef}
                controls
                src={nivel.url}
                className="w-100 rounded mb-3"
                style={{
                  width: nivel.width ? `${nivel.width}px` : "100%",
                  maxWidth: "1200px",
                  height: "550px",
                  borderRadius: "10px",
                  objectFit: "contain"
                }}
                onEnded={() => { if (!nivel.completado) marcarCompletado(nivel.id); }}
              />
            )}
          </>
        )}

        {/* DOCUMENTO PDF */}
        {nivel.tipo === "pdf" && (
          <div className="mb-3">
            <a
              href={nivel.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-secondary"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que active el click de la card
                if (!nivel.completado) marcarCompletado(nivel.id);
              }}
            >
              <i className="bi bi-file-earmark-pdf me-2"></i> Ver PDF
            </a>
          </div>
        )}

        {/* TEXTO */}
        {nivel.tipo === "texto" && (
          <div
            className="alert alert-secondary"
            onClick={(e) => e.stopPropagation()} // Prevenir doble activación
          >
            {nivel.contenido}
          </div>
        )}

        {/* IMAGEN / INFOGRAFÍA */}
        {nivel.tipo === "imagen" && (
          <>
            <button
              className="btn btn-outline-primary me-2"
              data-bs-toggle="modal"
              data-bs-target={`#modalImagen${nivel.id}`}
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que active el click de la card
                if (!nivel.completado) marcarCompletado(nivel.id);
              }}
            >
              <i className="bi bi-image me-2"></i>
              Ver infografía
            </button>

            {/* Modal */}
            <div
              className="modal fade"
              id={`modalImagen${nivel.id}`}
              tabIndex="-1"
              aria-hidden="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{nivel.titulo}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-center">
                    <img
                      src={nivel.url}
                      alt="Infografía"
                      className="img-fluid rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* BOTÓN MANUAL (actualizado para permitir desmarcar) */}
        <button
          className={`btn ${nivel.completado ? "btn-outline-success" : "btn-outline-primary"} w-100 mt-2`}
          onClick={(e) => {
            e.stopPropagation(); // Prevenir que active el click de la card
            marcarCompletado(nivel.id);
          }}
          disabled={!puedeAcceder}
        >
          {nivel.completado ? "🔄 Desmarcar" : "Marcar como completado"}
        </button>

      </div>
    </div>
  );
}
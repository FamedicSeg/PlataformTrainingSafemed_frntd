import { useState, useEffect } from 'react';
import '../styles/components/EmitirCertificadoFirmas.css';
import Swal from 'sweetalert2';

export default function EmitirCertificadoFirmas({ idCurso, idProceso, idUsuario, nombreUsuario, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');
  const adminId = localStorage.getItem('adminId');

  // Estados
  const [firmasDisponibles, setFirmasDisponibles] = useState([]);
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emitiendo, setEmitiendo] = useState(false);
  const [calificacion, setCalificacion] = useState('');

  // Cargar firmas del proceso
  useEffect(() => {
    cargarFirmasDelProceso();
  }, [idProceso]);

  const cargarFirmasDelProceso = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/firmas/proceso/${idProceso}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setFirmasDisponibles(data || []);
    } catch (error) {
      console.error('Error cargando firmas:', error);
      Swal.fire('Error', 'No se pudieron cargar las firmas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Agregar firma a seleccionadas
  const handleSeleccionarFirma = (firma) => {
    if (firmasSeleccionadas.length >= 3) {
      Swal.fire('Límite', 'Máximo 3 firmas por certificado', 'warning');
      return;
    }
    if (!firmasSeleccionadas.find(f => f.id === firma.id)) {
      setFirmasSeleccionadas([...firmasSeleccionadas, { ...firma, posicion: firmasSeleccionadas.length + 1 }]);
    }
  };

  // Remover firma
  const handleRemoverFirma = (idFirma) => {
    const nuevas = firmasSeleccionadas
      .filter(f => f.id !== idFirma)
      .map((f, idx) => ({ ...f, posicion: idx + 1 }));
    setFirmasSeleccionadas(nuevas);
  };

  // Cambiar posición de firma
  const handleCambiarPosicion = (idFirma, nueva_posicion) => {
    const nuevas = [...firmasSeleccionadas];
    const idx = nuevas.findIndex(f => f.id === idFirma);
    if (idx >= 0) {
      nuevas[idx].posicion = nueva_posicion;
    }
    setFirmasSeleccionadas(nuevas);
  };

  // Emitir certificado
  const handleEmitirCertificado = async () => {
    if (firmasSeleccionadas.length === 0) {
      Swal.fire('Validación', 'Selecciona al menos 1 firma', 'warning');
      return;
    }

    if (!calificacion || calificacion < 0 || calificacion > 100) {
      Swal.fire('Validación', 'Ingresa una calificación válida (0-100)', 'warning');
      return;
    }

    setEmitiendo(true);

    try {
      const res = await fetch(`${API_URL}/certificados/emitir-con-firmas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_usuario: idUsuario,
          id_curso: idCurso,
          id_proceso: idProceso,
          id_admin_creador: adminId,
          calificacion: parseFloat(calificacion),
          firmas: firmasSeleccionadas.map(f => ({
            id_firma_admin: f.id,
            posicion_firma: f.posicion
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          icon: 'success',
          title: '✓ Certificado Emitido',
          html: `<div style="text-align: left; font-size: 14px;">
                    <p><strong>Código:</strong> ${data.codigo_certificado}</p>
                    <p><strong>Usuario:</strong> ${nombreUsuario}</p>
                    <p><strong>Firmas:</strong> ${firmasSeleccionadas.length}</p>
                  </div>`,
          confirmButtonText: 'OK'
        });
        if (onClose) onClose(true);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error emitiendo certificado');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📜 Emitir Certificado con Firmas</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Información del usuario */}
          <div className="info-section">
            <p><strong>Usuario:</strong> {nombreUsuario}</p>
            <p><strong>Curso ID:</strong> {idCurso}</p>
            <p><strong>Proceso:</strong> {idProceso}</p>
          </div>

          {/* Calificación */}
          <div className="calificacion-section">
            <label>Calificación del Usuario *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Ej: 95.5"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
            />
          </div>

          {/* Firmas disponibles */}
          <div className="firmas-disponibles-section">
            <h3>Firmas Disponibles del Proceso</h3>
            {loading ? (
              <p>Cargando firmas...</p>
            ) : firmasDisponibles.length === 0 ? (
              <p className="empty">No hay firmas disponibles para este proceso</p>
            ) : (
              <div className="firmas-disponibles-grid">
                {firmasDisponibles.map(firma => {
                  const yaSeleccionada = firmasSeleccionadas.find(f => f.id === firma.id);
                  return (
                    <div
                      key={firma.id}
                      className={`firma-disponible ${yaSeleccionada ? 'selected' : ''}`}
                      onClick={() => !yaSeleccionada && handleSeleccionarFirma(firma)}
                    >
                      <img src={firma.imagen_firma_url} alt={firma.nombre_admin} />
                      <h5>{firma.nombre_admin}</h5>
                      <p>{firma.cargo}</p>
                      <button
                        type="button"
                        className={yaSeleccionada ? 'btn-seleccionado' : 'btn-seleccionar'}
                      >
                        {yaSeleccionada ? '✓ Seleccionado' : 'Seleccionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Firmas seleccionadas */}
          <div className="firmas-seleccionadas-section">
            <h3>Firmas Seleccionadas ({firmasSeleccionadas.length}/3)</h3>
            {firmasSeleccionadas.length === 0 ? (
              <p className="empty">No has seleccionado firmas aún</p>
            ) : (
              <div className="firmas-seleccionadas-list">
                {firmasSeleccionadas.map((firma, idx) => (
                  <div key={firma.id} className="firma-seleccionada">
                    <div className="firma-sel-info">
                      <img src={firma.imagen_firma_url} alt={firma.nombre_admin} />
                      <div>
                        <strong>{firma.nombre_admin}</strong>
                        <p>{firma.cargo}</p>
                      </div>
                    </div>
                    <div className="firma-sel-posicion">
                      <select
                        value={firma.posicion}
                        onChange={(e) => handleCambiarPosicion(firma.id, parseInt(e.target.value))}
                      >
                        <option value="1">Posición 1 (Superior izquierda)</option>
                        <option value="2">Posición 2 (Centro)</option>
                        <option value="3">Posición 3 (Inferior derecha)</option>
                      </select>
                    </div>
                    <button
                      className="btn-remover"
                      onClick={() => handleRemoverFirma(firma.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-emitir"
            onClick={handleEmitirCertificado}
            disabled={emitiendo || firmasSeleccionadas.length === 0}
          >
            {emitiendo ? '⏳ Emitiendo...' : '✔ Emitir Certificado'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Play, Square, Pause, RotateCcw, Download } from 'lucide-react';
import '../styles/components/recordingControls.css';

/**
 * Componente de controles para grabar reunión
 * Muestra botones: Iniciar, Pausar, Reanudar, Detener, Descargar
 */
export default function RecordingControls({ 
    isRecording, 
    isPaused, 
    recordingTime, 
    formattedTime,
    onStart, 
    onPause, 
    onResume, 
    onStop, 
    onDownload,
    onCancel
}) {
    return (
        <div className={`recording-controls-panel ${isRecording ? 'recording-active' : ''}`}>
            <div className="recording-header">
                <div className="recording-status">
                    {isRecording && (
                        <>
                            <span className="recording-indicator">
                                <span className="red-dot"></span>
                                {isPaused ? 'Pausada' : 'Grabando'}
                            </span>
                            <span className="recording-time">{formattedTime}</span>
                        </>
                    )}
                    {!isRecording && recordingTime === 0 && (
                        <span className="recording-status-text">Listo para grabar</span>
                    )}
                </div>
            </div>

            <div className="recording-buttons">
                {!isRecording ? (
                    <button
                        className="btn-recording btn-start"
                        onClick={onStart}
                        title="Iniciar grabación"
                    >
                        <Play size={18} />
                        <span>Grabar</span>
                    </button>
                ) : (
                    <>
                        {!isPaused ? (
                            <button
                                className="btn-recording btn-pause"
                                onClick={onPause}
                                title="Pausar grabación"
                            >
                                <Pause size={18} />
                                <span>Pausar</span>
                            </button>
                        ) : (
                            <button
                                className="btn-recording btn-resume"
                                onClick={onResume}
                                title="Reanudar grabación"
                            >
                                <Play size={18} />
                                <span>Reanudar</span>
                            </button>
                        )}

                        <button
                            className="btn-recording btn-stop"
                            onClick={onStop}
                            title="Detener grabación"
                        >
                            <Square size={18} />
                            <span>Detener</span>
                        </button>

                        <button
                            className="btn-recording btn-cancel"
                            onClick={onCancel}
                            title="Cancelar grabación"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </>
                )}

                {recordingTime > 0 && !isRecording && (
                    <>
                        <button
                            className="btn-recording btn-download"
                            onClick={onDownload}
                            title="Descargar grabación a tu carpeta de Descargas"
                        >
                            <Download size={18} />
                            <span>Descargar</span>
                        </button>
                        <p className="download-hint">💾 Se guardará en Descargas</p>
                    </>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Play, CheckCircle, AlertCircle, Share2, Check, Copy, Info } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import SalaJitsiMeet from './SalaJitsiMeet';
import ReporteAsistencia from './ReporteAsistencia';
import RecordingControls from './RecordingControls';
import { useRecording } from '../hooks/useRecording';
import '../styles/components/salaJitsiMeet.css';
import '../styles/components/misReunionesPanel.css';

export default function MisReunionesPanel() {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('admin_token');
    const userName = localStorage.getItem('admin_nombre') || 'Administrador';
    const userEmail = localStorage.getItem('admin_email') || 'admin@safemedec.com';

    const [reuniones, setReuniones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tiemposRestantes, setTiemposRestantes] = useState({});
    const [reunionActiva, setReunionActiva] = useState(null);
    const [reunionAsistenciaModal, setReunionAsistenciaModal] = useState(null);

    // Obtener mis reuniones
    useEffect(() => {
        fetchReuniones();
    }, []);

    const fetchReuniones = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/cursos/sincronicos/mis-reuniones`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener reuniones');
            }

            console.log('✅ Reuniones obtenidas:', data.data);
            setReuniones(data.data);
        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Actualizar timer cada segundo
    useEffect(() => {
        const interval = setInterval(() => {
            const nuevosTimers = {};
            reuniones.forEach(reunion => {
                const ahora = new Date();
                const inicio = new Date(reunion.fecha_inicio);
                const fin = new Date(reunion.fecha_fin);
                const diff = inicio - ahora;

                if (diff < 0 && ahora < fin) {
                    // La reunión está en progreso
                    nuevosTimers[reunion.id] = {
                        estado: 'en_vivo',
                        texto: '🔴 EN VIVO'
                    };
                } else if (diff < 0) {
                    // La reunión ya terminó
                    nuevosTimers[reunion.id] = {
                        estado: 'completada',
                        texto: '✓ Completada'
                    };
                } else {
                    // Faltan horas/minutos
                    const horas = Math.floor(diff / (1000 * 60 * 60));
                    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

                    nuevosTimers[reunion.id] = {
                        estado: 'proxima',
                        texto: `${horas}h ${minutos}m ${segundos}s`,
                        puedeComencar: false
                    };
                }
            });

            setTiemposRestantes(nuevosTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [reuniones]);

    const handleComenzarReunion = (reunion) => {
        console.log('🎥 Comenzando reunión:', reunion);
        setReunionActiva(reunion);
    };

    const handleSalirReunion = () => {
        setReunionActiva(null);
        // Recargar reuniones
        fetchReuniones();
    };

    // Si está mostrando una reunión activa, mostrar Jitsi
    if (reunionActiva) {
        return (
            <SalaJitsiMeetAnfitrion
                cursoId={reunionActiva.id_curso}
                moduloId={reunionActiva.modulo_id}
                nombreCurso={(reunionActiva.titulo || reunionActiva.nombre)}
                fechaInicio={reunionActiva.fecha_inicio}
                userEmail={userEmail}
                userName={userName}
                onSalir={handleSalirReunion}
            />
        );
    }

    if (loading) {
        return (
            <div className="mis-reuniones-container loading-state">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>⏳ Cargando reuniones...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mis-reuniones-container">
                <div className="error-state">
                    <AlertCircle size={32} />
                    <h4>Error al cargar reuniones</h4>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchReuniones}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (reuniones.length === 0) {
        return (
            <div className="mis-reuniones-container">
                <div className="empty-state">
                    <Video size={48} />
                    <h4>No hay reuniones programadas</h4>
                    <p>Cuando programes una reunión sincrónica, aparecerá aquí</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mis-reuniones-container">
            <div className="reuniones-header">
                <div className="header-content">
                    <div className="header-title">
                        <Video size={28} className="header-icon" />
                        <div>
                            <h2>Mis Reuniones</h2>
                            <p className="header-subtitle">{reuniones.length} reunión{reuniones.length !== 1 ? 'es' : ''} programada{reuniones.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
                <button
                    className="btn-actualizar"
                    onClick={fetchReuniones}
                    disabled={loading}
                    title="Recargar lista de reuniones"
                >
                    <span>🔄</span>
                </button>
            </div>

            <div className="reuniones-list">
                {reuniones.map(reunion => {
                    const timer = tiemposRestantes[reunion.id];
                    const puedeComenzar = timer?.estado === 'en_vivo';
                    const isCompleted = timer?.estado === 'completada';

                    return (
                        <div key={reunion.id} className={`reunion-card reunion-${timer?.estado}`}>
                            {/* Estado Badge */}
                            <span className={`estado-badge ${timer?.estado}`}>
                                {timer?.estado === 'en_vivo' && '🔴 EN VIVO'}
                                {timer?.estado === 'completada' && '✅ COMPLETADA'}
                                {timer?.estado === 'proxima' && '⏱️ PRÓXIMA'}
                            </span>

                            {/* Contenido */}
                            <div className="card-content">
                                <h4 className="reunion-nombre">{(reunion.titulo || reunion.nombre)}</h4>
                                <div className="reunion-meta">
                                    <div className="meta-item">
                                        <Calendar size={16} />
                                        <span>{new Date(reunion.fecha_inicio).toLocaleDateString('es-EC', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Clock size={16} />
                                        <span>
                                            {new Date(reunion.fecha_inicio).toLocaleTimeString('es-EC', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {reunion.participantes && (
                                        <div className="meta-item">
                                            <Users size={16} />
                                            <span>{reunion.participantes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="card-actions">
                                {puedeComenzar && (
                                    <button
                                        className="btn-accion btn-play"
                                        onClick={() => handleComenzarReunion(reunion)}
                                        title="Iniciar la reunión ahora"
                                    >
                                        <Play size={20} />
                                        <span>Comenzar</span>
                                    </button>
                                )}
                                {(isCompleted || timer?.estado === 'en_vivo') && (
                                    <button
                                        className="btn-accion btn-report"
                                        onClick={() => setReunionAsistenciaModal(reunion)}
                                        title="Ver reporte de asistencia"
                                    >
                                        <Users size={20} />
                                        <span>Asistencia</span>
                                    </button>
                                )}
                                {!puedeComenzar && (
                                    <div className="btn-placeholder">
                                        <Clock size={20} />
                                        <span>{isCompleted ? 'Finalizada' : 'No disponible'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Reporte de Asistencia */}
            {reunionAsistenciaModal && (
                <div className="modal-overlay" onClick={() => setReunionAsistenciaModal(null)}>
                    <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <Users size={24} className="modal-icon" />
                                <div>
                                    <h5>Reporte de Asistencia</h5>
                                    <p className="modal-subtitle">{(reunionAsistenciaModal.titulo || reunionAsistenciaModal.nombre)}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close-modal"
                                onClick={() => setReunionAsistenciaModal(null)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <ReporteAsistencia
                                cursoId={reunionAsistenciaModal.id_curso}
                                nombreCurso={(reunionAsistenciaModal.titulo || reunionAsistenciaModal.nombre)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente especial para Jitsi como anfitrión
function SalaJitsiMeetAnfitrion({ cursoId, moduloId, nombreCurso, fechaInicio, userEmail, userName, onSalir }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('admin_token');
    const nombreAdminProceso = userName || localStorage.getItem('admin_nombre') || 'Administrador';
    const nombreProceso = localStorage.getItem('admin_proceso') || 'Proceso';

    const [conferenciaCopy, setConferenciaCopy] = useState(false);
    const [participantesActuales, _setParticipantesActuales] = useState(1);
    const [horaInicio] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Hook de grabación
    const {
        isRecording,
        isPaused,
        recordingTime,
        formattedTime,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        downloadRecording,
        cancelRecording
    } = useRecording();

    // Generar roomName consistente (igual que en SalaJitsiMeet.jsx)
    const generarRoomName = () => {
      const prefix = moduloId ? 'modulo' : 'curso';
      const identificador = moduloId || cursoId;
      if (fechaInicio) {
        const fecha = new Date(fechaInicio);
        const dateStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        return `${prefix}-${identificador}-${dateStr}`;
      }
      return `${prefix}-${identificador}`;
    };

    const finalRoomName = generarRoomName();
    const linkInvitacion = `${window.location.origin}?jitsi_room=${finalRoomName}`;

    const copiarLink = () => {
        navigator.clipboard.writeText(linkInvitacion);
        setConferenciaCopy(true);
        setTimeout(() => setConferenciaCopy(false), 2000);
    };

    const handleConferenciaTerminada = () => {
        guardarConferencia();
        onSalir?.();
    };

    const guardarConferencia = async () => {
        try {
            setLoading(true);
            const horafin = new Date();
            const duracionMinutos = Math.round((horafin - horaInicio) / 60000);

            const dataConferencia = {
                roomName: finalRoomName,
                nombre_admin_proceso: nombreAdminProceso,
                nombre_proceso: nombreProceso,
                fecha_inicio: horaInicio.toISOString(),
                fecha_fin: horafin.toISOString(),
                duracion_minutos: duracionMinutos,
                participantes: participantesActuales,
                estado: 'Completada'
            };

            console.log('📤 Verificando si la conferencia ya existe:', finalRoomName);

            // Primero verificar si la conferencia ya existe
            const checkResponse = await fetch(`${API_URL}/api/cursos/${cursoId}/conferencias?roomName=${finalRoomName}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const checkData = await checkResponse.json();

            // Si ya existe una conferencia con ese roomName, no crear otra
            if (checkData.data && checkData.data.length > 0) {
                console.log('⚠️ La conferencia ya existe, no se crea duplicada');
                return;
            }

            console.log('📤 Enviando conferencia al backend:', dataConferencia);

            const response = await fetch(`${API_URL}/api/cursos/${cursoId}/conferencias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataConferencia)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Error al guardar la conferencia:', data);
            } else {
                console.log("✅ Conferencia guardada correctamente en BD:", data.data);
            }
        } catch (error) {
            console.error('❌ Error al guardar la conferencia:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sala-jitsi-anfitrion">
            {/* Header */}
            <div className="jitsi-header">
                <div className="header-left">
                    <Video size={24} className="icono-video" />
                    <div>
                        <h3>{nombreCurso}</h3>
                        <p className="subtitle">Anfitrión - Sala: {finalRoomName.substring(0, 30)}...</p>
                    </div>
                </div>

                <div className="header-center">
                    <div className="stat-item">
                        <Users size={16} />
                        <span>{participantesActuales} participante(s)</span>
                    </div>
                    <div className="stat-item">
                        <Clock size={16} />
                        <span>{horaInicio.toLocaleTimeString('es-EC')}</span>
                    </div>
                </div>

                <button className="btn-salir" onClick={handleConferenciaTerminada} disabled={loading}>
                    Salir
                </button>
            </div>

            {/* Main Container con Grid */}
            <div className="jitsi-anfitrion-sala">
                {/* Jitsi Meet */}
                <div className="jitsi-columna-sala">
                    <JitsiMeeting
                        roomName={finalRoomName}
                        displayName={nombreAdminProceso}
                        userEmail={userEmail}
                        onReadyToClose={handleConferenciaTerminada}
                        interfaceConfigOverwrite={{
                            TOOLBAR_BUTTONS: [
                                'camera', 'microphone', 'desktop', 'fullscreen', 'hangup',
                                'chat', 'recording', 'settings', 'raisehand', 'help'
                            ],
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_BRAND_WATERMARK: false,
                            MOBILE_APP_PROMO: false,
                            HIDE_INVITE_BUTTON: false
                        }}
                        configOverwrite={{
                            startWithAudioMuted: false,
                            startWithVideoMuted: false,
                            prejoinPageEnabled: false,
                            disableModeratorIndicator: false,
                            enableLobbyMode: false,
                            enableRecording: true,
                            recordingType: 'local',
                            enableInsecureRoomNameWarning: false,
                            enableWelcomePage: false,
                            requireDisplayName: false,
                            authRequired: false,
                            membersOnly: false,
                            moderatedRoomServiceUrl: '',
                            disableDisconnectIf: false,
                            disableInviteFunctions: false,
                            localRecording: true,
                            subject: nombreCurso,
                            features: {
                                recording: true,
                                livestreaming: false,
                                'show-virtual-background-button': true,
                                'screenshare.enabled': true,
                                'chat': true,
                                'polls': false,
                            },
                            desktopSharingChromeExtId: undefined,
                            desktopSharingChromeSources: ['screen', 'window'],
                            desktopSharingFirefoxDisabled: false,
                        }}
                        onApiReady={(externalApi) => {
                            console.log('✅ Jitsi API listo (Admin)');
                            externalApi.addEventListener('participantJoined', ()=>{
                                console.log('👤 Participante se unió');
                            });
                            externalApi.addEventListener('participantLeft', ()=>{
                                console.log('👤 Participante se fue');
                            });
                        }}
                        onError={(error) => {
                            console.error('❌ Error en Jitsi:', error);
                        }}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = '100%';
                            iframeRef.style.width = '100%';
                        }}
                    />
                </div>

                {/* Sidebar Controles */}
                <div className="jitsi-sidebar-controles">
                    {/* Panel de Grabación 
                    <div className="control-section">
                        <h4 className="section-title">
                            <span>🎥</span>
                            Grabación
                        </h4>
                        <RecordingControls
                            isRecording={isRecording}
                            isPaused={isPaused}
                            recordingTime={recordingTime}
                            formattedTime={formattedTime}
                            onStart={startRecording}
                            onPause={pauseRecording}
                            onResume={resumeRecording}
                            onStop={stopRecording}
                            onDownload={() => downloadRecording(`Reunion-${nombreCurso}-${new Date().toISOString().slice(0, 10)}.webm`)}
                            onCancel={cancelRecording}
                        />
                    </div>
                    */}

                    {/* Panel de Invitación */}
                    <div className="control-section">
                        <h4 className="section-title">
                            <Share2 size={18} />
                            Compartir
                        </h4>
                        <div className="invitacion-panel">
                            <p className="section-description">Comparte este enlace con los participantes:</p>
                            <div className="link-container">
                                <input type="text" value={linkInvitacion} readOnly className="link-input" />
                                <button
                                    className={`btn-copiar ${conferenciaCopy ? 'copiado' : ''}`}
                                    onClick={copiarLink}
                                    title="Copiar enlace de invitación"
                                >
                                    {conferenciaCopy ? (
                                        <>
                                            <Check size={16} />
                                            Copiado
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copiar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Panel de Información */}
                    <div className="control-section">
                        <h4 className="section-title">
                            <Info size={18} />
                            Información
                        </h4>
                        <div className="info-panel">
                            <div className="info-item">
                                <span className="label">Proceso:</span>
                                <span className="value">{nombreProceso}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Anfitrión:</span>
                                <span className="value">{nombreAdminProceso}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Sala:</span>
                                <span className="value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                                    {finalRoomName}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Inicio:</span>
                                <span className="value">{horaInicio.toLocaleString('es-EC')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

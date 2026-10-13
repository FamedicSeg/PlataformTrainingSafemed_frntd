import React, { useState, useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Video, LogOut, Clock, Users } from 'lucide-react';
import { useJitsi } from '../context/JitsiContext';
import RecordingControls from './RecordingControls';
import { useRecording } from '../hooks/useRecording';
import '../styles/components/salaJitsiMeet.css';

const SalaJitsiMeet = ({ cursoId, moduloId, nombreCurso, nombreModulo, userEmail, userName, onCerrar, fechaInicio, isFloating = false }) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const { endJitsiSession } = useJitsi();
    
    // Usar user_token para usuarios regulares, admin_token solo si está disponible
    const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token');
    
    // Obtener datos del usuario desde localStorage
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    
    // Usar los parámetros pasados, con fallback a localStorage
    const displayName = userName || usuarioLogueado.nombre || localStorage.getItem('admin_nombre') || 'Participante';
    const userEmailFinal = userEmail || usuarioLogueado.email || localStorage.getItem('admin_email') || 'participante@safemedec.com';
    const usuarioId = usuarioLogueado.id;
    const _nombreProceso = localStorage.getItem('admin_proceso') || localStorage.getItem('proceso_nombre') || 'Proceso';

    // Determinar si es módulo o curso
    const esModulo = !!moduloId;
    const identificador = esModulo ? moduloId : cursoId;
    const nombre = esModulo ? nombreModulo : nombreCurso;

    console.log('👤 Usuario en Jitsi:', { displayName, userEmailFinal, usuarioId, isFloating, esModulo, identificador });

    // Generar roomName consistente basado en moduloId o cursoId + fecha
    // Si no hay fecha, usar solo ID (para compatibilidad)
    const generarRoomName = () => {
      if (fechaInicio) {
        const fecha = new Date(fechaInicio);
        const dateStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        const prefix = esModulo ? 'modulo' : 'curso';
        return `${prefix}-${identificador}-${dateStr}`;
      }
      const prefix = esModulo ? 'modulo' : 'curso';
      return `${prefix}-${identificador}`;
    };

    const [roomName] = useState(generarRoomName());
    const [conferenciaCopy, setConferenciaCopy] = useState(false);
    const [participantesActuales, setParticipantesActuales] = useState(1);
    const [horaInicio] = useState(new Date());
    const [_loading, _setLoading] = useState(false);
    const [asistenciaRegistrada, setAsistenciaRegistrada] = useState(false);
    const entradaEnviada = useRef(false);

    // Hook de grabación
    {/*
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
    } = useRecording(); */}

    // Registrar entrada a la conferencia
    useEffect(() => {
      if (usuarioId && !asistenciaRegistrada && !entradaEnviada.current) {
        entradaEnviada.current = true;
        registrarEntrada();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const registrarEntrada = async () => {
      if (!usuarioId) {
        console.warn('⚠️ No se pudo registrar entrada: usuarioId no disponible');
        return;
      }

      try {
        if (esModulo) {
          console.log(`📝 Registrando entrada del usuario ${usuarioId} al módulo ${moduloId}`);
          const response = await fetch(`${API_URL}/api/modulos/${moduloId}/registrar-asistencia`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ usuario_id: usuarioId })
          });

          const data = await response.json();
          if (response.ok) {
            console.log('✅ Entrada registrada en módulo:', data);
            setAsistenciaRegistrada(true);
          } else {
            console.error('❌ Error registrando entrada:', data);
          }
        } else {
          console.log(`📝 Registrando entrada del usuario ${usuarioId} al curso ${cursoId}`);
          const response = await fetch(`${API_URL}/api/cursos/${cursoId}/asistencia/registrar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ usuarioId: usuarioId })
          });

          const data = await response.json();
          if (response.ok) {
            console.log('✅ Entrada registrada:', data);
            setAsistenciaRegistrada(true);
          } else {
            console.error('❌ Error registrando entrada:', data);
          }
        }
      } catch (error) {
        console.error('❌ Error en registrarEntrada:', error);
      }
    };

    const registrarSalida = async () => {
      if (!usuarioId) {
        console.warn('⚠️ No se pudo registrar salida: usuarioId no disponible');
        return;
      }

      try {
        if (esModulo) {
          console.log(`📝 Registrando salida del usuario ${usuarioId} del módulo ${moduloId}`);
          const response = await fetch(`${API_URL}/api/modulos/${moduloId}/registrar-salida`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ usuario_id: usuarioId })
          });

          const data = await response.json();
          if (response.ok) {
            console.log('✅ Salida registrada en módulo:', data);
          } else {
            console.error('❌ Error registrando salida:', data);
          }
        } else {
          console.log(`📝 Registrando salida del usuario ${usuarioId} del curso ${cursoId}`);
          const response = await fetch(`${API_URL}/api/cursos/${cursoId}/asistencia/salida`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ usuarioId: usuarioId })
          });

          const data = await response.json();
          if (response.ok) {
            console.log('✅ Salida registrada:', data);
          } else {
            console.error('❌ Error registrando salida:', data);
          }
        }
      } catch (error) {
        console.error('❌ Error en registrarSalida:', error);
      }
    };

    // Generamos el link de la invitación a la reunión
    const linkInvitacion = `${window.location.origin}?jitsi_room=${roomName}`;
    const copiarLink = () => {
        navigator.clipboard.writeText(linkInvitacion);
        setConferenciaCopy(true);
        setTimeout(() => setConferenciaCopy(false), 2000);
    };

    const handleConferenciaTerminada = () => {
        // Registrar salida
        registrarSalida();
        
        if (isFloating) {
          // Si está en modo flotante, usar el contexto
          endJitsiSession();
        } else {
          // Si está en modo normal, usar callback
          onCerrar?.();
        }
    };

    return (
        <div className="sala-jitsi-contenedor-principal-usuario">
            {/* Header de la conferencia*/}
            <div className="jitsi-header">
                <div className="header-left">
                    <div className="curso-info">
                        <div className="icono-container">
                            <Video size={28} className="icono-video" />
                        </div>
                        <div className="info-text">
                            <h3>{nombre}</h3>
                            <p className="room-name">🔗 {roomName.substring(0, 28)}...</p>
                        </div>
                    </div>
                </div>

                <div className="header-center">
                    <div className="stats-container">
                        <div className="stat-item stat-participants">
                            <Users size={18} />
                            <div className="stat-text">
                                <span className="stat-value">{participantesActuales}</span>
                                <span className="stat-label">participantes</span>
                            </div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item stat-time">
                            <Clock size={18} />
                            <div className="stat-text">
                                <span className="stat-value">{horaInicio.toLocaleTimeString('es-EC', {hour: '2-digit', minute: '2-digit'})}</span>
                                <span className="stat-label">inicio</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/*
                <button className="btn-salir" onClick={handleConferenciaTerminada} disabled={_loading}>
                    <LogOut size={18} />
                    <span>Salir</span>
                </button>
                */}
            </div>

            {/* Contenedor principal - Layout Jitsi + Controles */}
            <div className="jitsi-principal-container-usuario">
                {/* Sala Jitsi Meet */}
                <div className="jitsi-sala-contenedor-usuario">
                <JitsiMeeting
                    roomName={roomName}
                    displayName={displayName}
                    userEmail={userEmailFinal}
                    configOverwrite={{
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: true,
                        disableModeratorIndicator: true,
                        enableLobbyMode: false,
                        enableRecording: true,
                        recordingType: 'local',
                        enableInsecureRoomNameWarning: false,
                        enableWelcomePage: false,
                        requireDisplayName: false,
                        // Deshabilitar autenticación y membersOnly
                        authRequired: false,
                        membersOnly: false,
                        moderatedRoomServiceUrl: '',
                        disableDisconnectIf: false,
                        // NO MOSTRAR OPCIÓN DE ANFITRIÓN
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
                    interfaceConfigOverwrite={{
                        TOOLBAR_BUTTONS: [
                            'camera', 'microphone', 'desktop', 'fullscreen', 'hangup',
                            'chat', 'recording', 'settings', 'raisehand', 'help'
                        ],
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        DEFAULT_BACKGROUND: '#222222',
                        MOBILE_APP_PROMO: false,
                        HIDE_INVITE_BUTTON: false
                    }}
                    onApiReady={(externalApi) => {
                        console.log('✅ Jitsi API listo');
                        externalApi.addEventListener('participantJoined', ()=>{
                            setParticipantesActuales((prev) => prev + 1);
                        });
                        externalApi.addEventListener('participantLeft', ()=>{
                            setParticipantesActuales((prev) => Math.max(1, prev - 1));
                        });
                    }}
                    onReadyToClose={handleConferenciaTerminada}
                    onError={(error) => {
                        console.error('❌ Error en Jitsi:', error);
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }}
                />
            </div>

            {/* Panel de controles lateral */}
            <div className="jitsi-sidebar-controles">
                <div className="sidebar-content">
                    {/* Sección de compartir */}
                    <div className="control-section">
                        <h4 className="section-title">
                            <span className="title-icon">📤</span>
                            Compartir
                        </h4>
                        <div className="link-container">
                            <input type="text" value={linkInvitacion} readOnly className="link-input" title="Enlace de invitación"/>
                            <button className={`btn-copiar ${conferenciaCopy ? 'copiado': ''}`} onClick={copiarLink} title="Copiar enlace">
                                {conferenciaCopy ? '✓' : '📋'}
                            </button>
                        </div>
                        <p className="section-hint">Comparte este enlace con los participantes</p>
                    </div>

                    {/* Sección de grabación 
                    <div className="control-section">
                        <h4 className="section-title">
                            <span className="title-icon">🎥</span>
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

                    {/* Sección de configuración */}
                    <div className="control-section">
                        <h4 className="section-title">
                            <span className="title-icon">⚙️</span>
                            Configuración
                        </h4>
                        <div className="config-opciones">
                            <label className="opcion-config">
                                <input type="checkbox" defaultChecked disabled />
                                <span>📷 Cámara</span>
                            </label>
                            <label className="opcion-config">
                                <input type="checkbox" defaultChecked disabled />
                                <span>🎤 Micrófono</span>
                            </label>
                            <label className="opcion-config">
                                <input type="checkbox" defaultChecked disabled />
                                <span>💬 Chat</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default SalaJitsiMeet;
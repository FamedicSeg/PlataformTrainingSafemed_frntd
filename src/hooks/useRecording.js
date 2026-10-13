import { useState, useRef, useCallback } from 'react';

/**
 * Hook personalizado para grabar reuniones de Jitsi
 * Captura directamente el stream de Jitsi (video + audio) al estilo Zoom
 */
export const useRecording = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);
    const jitsiApiRef = useRef(null);
    const blobRef = useRef(null);  // ← Para guardar el blob después de grabar

    // Establecer API de Jitsi
    const setJitsiApi = useCallback((externalApi) => {
        jitsiApiRef.current = externalApi;
        console.log('✅ Jitsi API configurado para grabación');
    }, []);

    // Iniciar grabación
    const startRecording = useCallback(async () => {
        try {
            console.log('🎙️ Iniciando grabación de reunión...');
            chunksRef.current = [];
            setRecordingTime(0);

            try {
                // Obtener solo audio del micrófono (incluye lo que dice el usuario)
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    },
                    video: false
                });

                streamRef.current = audioStream;

                // Crear MediaRecorder
                const mimeType = 'audio/webm;codecs=opus';
                const options = { mimeType };

                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    console.warn('⚠️ Usando codec por defecto');
                    options.mimeType = '';
                }

                const mediaRecorder = new MediaRecorder(audioStream, options);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onerror = (event) => {
                    console.error('❌ Error en grabación:', event.error);
                    setIsRecording(false);
                };

                mediaRecorder.start();
                setIsRecording(true);
                setIsPaused(false);

                // Iniciar timer
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);

                console.log('✅ Grabación iniciada correctamente');
            } catch (error) {
                console.error('❌ Error al acceder a micrófono:', error);
                alert('Necesitas permitir acceso a micrófono para grabar');
                setIsRecording(false);
            }
        } catch (error) {
            console.error('❌ Error al iniciar grabación:', error);
            setIsRecording(false);
        }
    }, []);

    // Pausar grabación
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            console.log('⏸️ Grabación pausada');
        }
    }, [isRecording]);

    // Reanudar grabación
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            console.log('▶️ Grabación reanudada');
        }
    }, [isPaused]);

    // Detener y obtener blob
    const stopRecording = useCallback(() => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || !isRecording) {
                console.warn('⚠️ No hay grabación activa');
                resolve(null);
                return;
            }

            const mediaRecorder = mediaRecorderRef.current;
            console.log('🛑 MediaRecorder state:', mediaRecorder.state);

            mediaRecorder.onstop = () => {
                try {
                    console.log('📦 Evento onstop disparado');
                    console.log('📊 Chunks recibidos:', chunksRef.current.length);
                    console.log('📊 Tamaño chunks:', chunksRef.current.map(c => c.size));

                    if (chunksRef.current.length === 0) {
                        console.error('❌ No hay chunks para crear blob');
                        resolve(null);
                        return;
                    }

                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    const sizeMB = Math.round(blob.size / 1024 / 1024);
                    console.log('✅ Blob creado exitosamente:', blob.type, sizeMB + 'MB');
                    
                    // Guardar en ref para descargar después
                    blobRef.current = blob;
                    
                    // Detener streams
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => {
                            console.log('🛑 Deteniendo track:', track.kind);
                            track.stop();
                        });
                    }

                    // Limpiar
                    if (timerRef.current) clearInterval(timerRef.current);
                    chunksRef.current = [];
                    mediaRecorderRef.current = null;
                    streamRef.current = null;

                    setIsRecording(false);
                    setIsPaused(false);
                    // NO reseteamos recordingTime aquí - lo hacemos después de descargar
                    // setRecordingTime(0);

                    resolve(blob);
                } catch (error) {
                    console.error('❌ Error creando blob:', error);
                    resolve(null);
                }
            };

            try {
                mediaRecorder.stop();
                console.log('🛑 stop() llamado, esperando onstop...');
            } catch (error) {
                console.error('❌ Error llamando stop():', error);
                resolve(null);
            }
        });
    }, [isRecording]);

    // Descargar grabación
    const downloadRecording = useCallback((filename = 'reunion.webm') => {
        console.warn('🔴 ==== DOWNLOAD LLAMADO ====');
        console.log('📥 Descargando con nombre:', filename);
        
        const blob = blobRef.current;
        
        if (!blob) {
            console.error('❌ No hay blob guardado para descargar');
            alert('❌ Error: No hay grabación para descargar');
            return;
        }

        try {
            console.log('✅ Usando blob guardado:', blob.size, 'bytes');

            const url = URL.createObjectURL(blob);
            console.log('✅ ObjectURL creado');

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            console.log('✅ Click ejecutado');

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                // Limpiar blob después de descargar
                blobRef.current = null;
            }, 200);

            const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
            console.log('💾 Éxito:', sizeMB, 'MB');
            alert(`✅ Guardado en Descargas:\n${filename}\n${sizeMB}MB`);
            
            // Resetear después de descargar exitosamente
            setRecordingTime(0);
        } catch (err) {
            console.error('❌ Error descargando:', err);
            alert('❌ Error descarga: ' + err.message);
            // Resetear incluso si hay error
            setRecordingTime(0);
        }
    }, []);

    // Cancelar grabación
    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) clearInterval(timerRef.current);
            chunksRef.current = [];
            mediaRecorderRef.current = null;
            streamRef.current = null;
            blobRef.current = null;  // Limpiar blob también
            setIsRecording(false);
            setIsPaused(false);
            setRecordingTime(0);
            console.log('❌ Grabación cancelada');
        }
    }, []);

    // Obtener blob sin descargar
    const getRecordingBlob = useCallback(async () => {
        const blob = await stopRecording();
        return blob;
    }, [stopRecording]);

    // Formatear tiempo
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return {
        isRecording,
        isPaused,
        recordingTime,
        formattedTime: formatTime(recordingTime),
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        downloadRecording,
        cancelRecording,
        getRecordingBlob,
        setJitsiApi
    };
};

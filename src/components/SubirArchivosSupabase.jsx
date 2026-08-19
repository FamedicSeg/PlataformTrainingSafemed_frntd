import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SubirArchivoSupabase({ 
  cursoId, 
  onUploadSuccess, 
  onUploadError,
  buttonLabel = "📤 Subir archivo",
  className = "btn btn-primary"
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  //Función para limpiar el nombre del archivo
  const limpiarNombreArchivo = (nombre) => {
    if(!nombre) return 'archivo';

    const ultimoPunto = nombre.lastIndexOf('.');
    const nombreSinExtension = ultimoPunto > 0 ? nombre.substring(0, ultimoPunto) : nombre;
    const extension = ultimoPunto > 0 ? nombre.substring(ultimoPunto) : '';
    //Limpiar el nombre: reemplazar espacio, tildes, caracteres especiales
    const nombreLimpio = nombreSinExtension
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Reemplazar caracteres especiales por guion bajo
        .replace(/_+/g, '_') // Reemplazar múltiples guiones bajos por uno solo
        .replace(/^_+|_+$/g, ''); // Quitar guiones bajos al inicio y al final

        return nombreLimpio + extension;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar tamaño (máximo 50 MB en plan gratuito)
    if (file.size > 50 * 1024 * 1024) {
      alert('❌ El archivo es muy grande. Máximo 50 MB.');
      event.target.value = '';
      return;
    }

    //Limpiar el nombre del archivo antes de subirlo
    const nombreLimpio = limpiarNombreArchivo(file.name);
    const nombreOriginal = file.name;

    setFileName(nombreOriginal);
    setUploading(true);
    setProgress(0);

    try {
      // Generar nombre único para el archivo
      const filePath = `${cursoId}/${Date.now()}_${nombreLimpio}`;

      console.log('📤 Subiendo archivo a Supabase:', {
        path: filePath,
        originalName: nombreOriginal,
        cleanName: nombreLimpio,
        size: file.size,
        type: file.type
      });

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('modulos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Datos de subida:', data);

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('modulos')
        .getPublicUrl(filePath);

      console.log('✅ URL pública generada:', publicUrlData.publicUrl);

      // ✅ Devolver TANTO la URL completa como el path
      if (onUploadSuccess) {
        onUploadSuccess({
          url: publicUrlData.publicUrl,      
          path: filePath,                    
          name: nombreOriginal,
          cleanName: nombreLimpio,
          size: file.size,
          type: file.type
        });
      }

      setProgress(100);
      
    } catch (error) {
      console.error('❌ Error subiendo:', error);
      if (onUploadError) {
        onUploadError(error);
      }
      alert('❌ Error al subir el archivo: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        id="file-upload-supabase"
        onChange={handleFileChange}
        disabled={uploading}
        accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.docx,.xlsx,.pptx"
        style={{ display: 'none' }}
      />
      <label 
        htmlFor="file-upload-supabase" 
        className={className}
        style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1
        }}
      >
        {uploading ? '⏳ Subiendo...' : buttonLabel}
      </label>
      
      {uploading && (
        <div className="progress-container" style={{ marginTop: '10px' }}>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {progress}% - Subiendo {fileName}...
          </p>
        </div>
      )}
    </div>
  );
}
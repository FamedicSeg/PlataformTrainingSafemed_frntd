import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SubirArchivoSupabase({ cursoId, onUploadSuccess, onUploadError }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar tamaño (máximo 50 MB en plan gratuito)
    if (file.size > 50 * 1024 * 1024) {
      alert('❌ El archivo es muy grande. Máximo 50 MB.');
      event.target.value = '';
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${cursoId}/${Date.now()}_${file.name}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('modulos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('modulos')
        .getPublicUrl(fileName);

      console.log('✅ Archivo subido:', publicUrlData.publicUrl);

      // Notificar al componente padre
      if (onUploadSuccess) {
        onUploadSuccess({
          url: publicUrlData.publicUrl,
          path: fileName,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }

      setProgress(100);
      alert('✅ Archivo subido exitosamente!');
      
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
    <div className="upload-container" style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
      <div className="upload-header">
        <h4>📤 Subir archivo al módulo</h4>
        <p className="text-muted" style={{ fontSize: '14px' }}>
          Formatos permitidos: JPG, PNG, WebP, MP4, WEBM, PDF, DOCX, XLSX, PPTX
          <br />
          Tamaño máximo: 50 MB
        </p>
      </div>

      <div className="upload-input">
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          disabled={uploading}
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.docx,.xlsx,.pptx"
          style={{ display: 'none' }}
        />
        <label 
          htmlFor="file-upload" 
          className="upload-label"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '5px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1
          }}
        >
          {uploading ? '⏳ Subiendo...' : '📁 Seleccionar archivo'}
        </label>
        {fileName && !uploading && (
          <span style={{ marginLeft: '15px', color: 'green' }}>
            ✅ {fileName}
          </span>
        )}
      </div>

      {uploading && (
        <div className="progress-container" style={{ marginTop: '15px' }}>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Subiendo {fileName}...
          </p>
        </div>
      )}
    </div>
  );
}
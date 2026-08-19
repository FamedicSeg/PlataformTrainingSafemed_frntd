import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MostrarArchivo({ path, tipo, titulo }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarArchivo = async () => {
      try {
        setLoading(true);
        
        // Obtener URL pública del archivo
        const { data } = supabase.storage
          .from('modulos')
          .getPublicUrl(path);

        setUrl(data.publicUrl);
        setError(null);
      } catch (err) {
        console.error('Error cargando archivo:', err);
        setError('No se pudo cargar el archivo');
      } finally {
        setLoading(false);
      }
    };

    if (path) {
      cargarArchivo();
    }
  }, [path]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando archivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        ❌ {error}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="alert alert-warning">
        ⚠️ No se encontró el archivo
      </div>
    );
  }

  // Renderizar según el tipo
  switch (tipo) {
    case 'imagen':
      return (
        <div style={{ textAlign: 'center' }}>
          <img 
            src={url} 
            alt={titulo || 'Imagen'} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '500px', 
              objectFit: 'contain',
              borderRadius: '8px' 
            }}
          />
        </div>
      );

    case 'video':
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <video 
            controls 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%' 
            }}
          >
            <source src={url} />
            Tu navegador no soporta el elemento de video.
          </video>
        </div>
      );

    case 'pdf':
      return (
        <iframe
          src={url}
          style={{ 
            width: '100%', 
            height: '600px', 
            border: 'none',
            borderRadius: '8px' 
          }}
          title={titulo || 'PDF'}
        />
      );

    case 'word':
    case 'excel':
    case 'powerpoint':
      return (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ fontSize: '48px' }}>
            {tipo === 'word' && '📝'}
            {tipo === 'excel' && '📊'}
            {tipo === 'powerpoint' && '📽️'}
          </div>
          <p>{titulo || 'Documento Office'}</p>
          <a 
            href={url} 
            download 
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 Descargar archivo
          </a>
        </div>
      );

    default:
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Tipo de archivo no soportado</p>
          <a href={url} download className="btn btn-primary">
            📥 Descargar archivo
          </a>
        </div>
      );
  }
}
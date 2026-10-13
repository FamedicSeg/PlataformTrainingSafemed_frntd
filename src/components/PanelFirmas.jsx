import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import '../styles/components/PanelFirmas.css';
import Swal from 'sweetalert2';

export default function PanelFirmas() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  // Estados
  const [procesos, setProcesos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [firmas, setFirmas] = useState([]);
  const [loadingFirmas, setLoadingFirmas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Formulario
  const [formFirma, setFormFirma] = useState({
    id_admin: '',
    id_proceso: '',
    nombre_admin: '',
    cargo: '',
    file: null
  });

  // Cargar procesos y firmas al montar
  useEffect(() => {
    cargarProcesos();
    cargarUsuarios();
    cargarFirmas();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // CARGAR PROCESOS
  // ──────────────────────────────────────────────────────────────
  const cargarProcesos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/procesos`);
      if (!res.ok) {
        console.error(`Error HTTP ${res.status}`);
        setProcesos([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setProcesos([]);
        return;
      }
      const data = JSON.parse(text);
      setProcesos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando procesos:', error);
      setProcesos([]);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // CARGAR USUARIOS
  // ──────────────────────────────────────────────────────────────
  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/load`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error(`Error HTTP ${res.status}`);
        setUsuarios([]);
        return;
      }
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsuarios([]);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // CARGAR FIRMAS
  // ──────────────────────────────────────────────────────────────
  const cargarFirmas = async () => {
    setLoadingFirmas(true);
    try {
      const res = await fetch(`${API_URL}/admin/firmas/listar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error(`Error HTTP ${res.status}`);
        setFirmas([]);
        setLoadingFirmas(false);
        return;
      }
      const text = await res.text();
      if (!text) {
        setFirmas([]);
        setLoadingFirmas(false);
        return;
      }
      const data = JSON.parse(text);
      setFirmas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando firmas:', error);
      setFirmas([]);
    } finally {
      setLoadingFirmas(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // SUBIR FIRMA
  // ──────────────────────────────────────────────────────────────
  const handleSubirFirma = async (e) => {
    e.preventDefault();

    if (!formFirma.file || !formFirma.id_admin || !formFirma.id_proceso || !formFirma.nombre_admin || !formFirma.cargo) {
      Swal.fire('Validación', 'Completa todos los campos', 'warning');
      return;
    }

    setSubiendo(true);

    try {
      // 1. Subir imagen a Supabase
      const fileName = `firma_${formFirma.id_proceso}_${Date.now()}.png`;
      const { data, error: uploadError } = await supabase.storage
        .from('firmas')
        .upload(fileName, formFirma.file);

      if (uploadError) {
        throw new Error('Error subiendo imagen: ' + uploadError.message);
      }

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('firmas')
        .getPublicUrl(data.path);

      // 3. Guardar en BD
      const res = await fetch(`${API_URL}/admin/firmas/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_admin: formFirma.id_admin,
          id_proceso: formFirma.id_proceso,
          nombre_admin: formFirma.nombre_admin,
          cargo: formFirma.cargo,
          imagen_firma_url: publicUrl
        })
      });

      if (res.ok) {
        Swal.fire('✓ Éxito', 'Firma guardada correctamente', 'success');
        setFormFirma({
          id_admin: '',
          id_proceso: '',
          nombre_admin: '',
          cargo: '',
          file: null
        });
        cargarFirmas();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error guardando firma');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSubiendo(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // ELIMINAR FIRMA
  // ──────────────────────────────────────────────────────────────
  const handleEliminarFirma = async (id, nombreAdmin) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar firma?',
      text: `¿Deseas eliminar la firma de ${nombreAdmin}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/admin/firmas/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          Swal.fire('✓ Eliminado', 'Firma eliminada correctamente', 'success');
          cargarFirmas();
        } else {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || error.message || `Error eliminando firma (${res.status})`);
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  // ──────────────────────────────────────────────────────────────
  // AGRUPAR FIRMAS POR PROCESO
  // ──────────────────────────────────────────────────────────────
  const firmasAgrupadas = {};
  if (Array.isArray(firmas)) {
    firmas.forEach(firma => {
      const procesoNombre = procesos.find(p => p.id === firma.id_proceso)?.nombre || 'Sin proceso';
      if (!firmasAgrupadas[procesoNombre]) {
        firmasAgrupadas[procesoNombre] = [];
      }
      firmasAgrupadas[procesoNombre].push(firma);
    });
  }

  return (
    <div className="panel-firmas-container">
      <div className="panel-firmas-header">
        <h2>Gestionar Firmas por Proceso</h2>
        <p className="subtitle">Carga las firmas de los admins/técnicos para cada proceso</p>
      </div>

      {/* ──── FORMULARIO DE CARGA ──── */}
      <div className="panel-firmas-form-section">
        <h3>Agregar Nueva Firma</h3>
        <form onSubmit={handleSubirFirma} className="form-firmas">
          <div className="form-row">
            <div className="form-group">
              <label>Selecciona el Proceso *</label>
              <select
                value={formFirma.id_proceso}
                onChange={(e) => setFormFirma({ ...formFirma, id_proceso: e.target.value })}
                required
              >
                <option value="">-- Selecciona --</option>
                {Array.isArray(procesos) && procesos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Selecciona Admin/Técnico *</label>
              <select
                value={formFirma.id_admin}
                onChange={(e) => {
                  const usuarioSeleccionado = Array.isArray(usuarios) ? usuarios.find(u => u.id === parseInt(e.target.value)) : null;
                  setFormFirma({
                    ...formFirma,
                    id_admin: e.target.value,
                    nombre_admin: usuarioSeleccionado?.nombre || ''
                  });
                }}
                required
              >
                <option value="">-- Selecciona --</option>
                {Array.isArray(usuarios) && usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.cargo || 'Sin cargo'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
              <div className="form-group">
                <label>Cargo *</label>
                <input
                  type="text"
                  placeholder="Ej: Jefe de Talento Humano"
                  value={formFirma.cargo}
                  onChange={(e) => setFormFirma({ ...formFirma, cargo: e.target.value })}
                  required
                />
              </div>
            </div>

          <div className="form-group">
            <label>Imagen de Firma (PNG/JPG) *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormFirma({ ...formFirma, file: e.target.files[0] })}
              required
            />
            {formFirma.file && <small className="file-name">✓ {formFirma.file.name}</small>}
          </div>

          <button type="submit" disabled={subiendo} className="btn-submit">
            {subiendo ? '⏳ Subiendo...' : '✔ Guardar Firma'}
          </button>
        </form>
      </div>

      {/* ──── LISTADO DE FIRMAS ──── */}
      <div className="panel-firmas-list-section">
        <h3>Firmas Registradas</h3>
        {loadingFirmas ? (
          <p className="loading">Cargando firmas...</p>
        ) : Object.keys(firmasAgrupadas).length === 0 ? (
          <p className="empty-state">No hay firmas registradas aún</p>
        ) : (
          Object.entries(firmasAgrupadas).map(([proceso, firmasDelProceso]) => (
            <div key={proceso} className="proceso-grupo">
              <h4 className="proceso-titulo">🔹 {proceso}</h4>
              <div className="firmas-grid">
                {firmasDelProceso.map(firma => (
                  <div key={firma.id} className="firma-card">
                    <div className="firma-imagen">
                      <img src={firma.imagen_firma_url} alt={firma.nombre_admin} />
                    </div>
                    <div className="firma-info">
                      <h5>{firma.nombre_admin}</h5>
                      <p className="cargo">{firma.cargo}</p>
                      <small className="fecha">
                        {new Date(firma.fecha_creacion).toLocaleDateString('es-ES')}
                      </small>
                    </div>
                    <div className="firma-acciones">
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminarFirma(firma.id, firma.nombre_admin)}
                        title="Eliminar firma"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

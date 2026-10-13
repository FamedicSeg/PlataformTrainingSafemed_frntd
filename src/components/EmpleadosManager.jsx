import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Trash2, RefreshCw, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/empleadosManager.css';

const FORM_VACIO = { nombre: '', cedula_identidad: '', proceso: '', cargo: '', empresa_socio: '' };

export default function EmpleadosManager() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token]
  );

  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/usuarios/empleados`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setEmpleados(data.data || []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los empleados.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, headers]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    const t = search.trim().toLowerCase();
    return empleados.filter(e =>
      (e.nombre || '').toLowerCase().includes(t) ||
      (e.cedula_identidad || '').toLowerCase().includes(t) ||
      (e.proceso || '').toLowerCase().includes(t)
    );
  }, [empleados, search]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const agregar = async (e) => {
    e.preventDefault();
    setSaving(true);
    const editando = editingId !== null;
    try {
      const res = await fetch(
        `${API_URL}/api/usuarios/empleados${editando ? `/${editingId}` : ''}`,
        { method: editando ? 'PUT' : 'POST', headers, body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) {
        Swal.fire('Error', data.message || `No se pudo ${editando ? 'actualizar' : 'agregar'} el empleado`, 'error');
        return;
      }
      setForm(FORM_VACIO);
      setEditingId(null);
      Swal.fire({ icon: 'success', title: editando ? 'Empleado actualizado' : 'Empleado agregado', timer: 1500, showConfirmButton: false });
      cargar();
    } catch {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editar = (emp) => {
    setEditingId(emp.id);
    setForm({
      nombre: emp.nombre || '',
      cedula_identidad: emp.cedula_identidad || '',
      proceso: emp.proceso || '',
      cargo: emp.cargo || '',
      empresa_socio: emp.empresa_socio || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setForm(FORM_VACIO);
  };

  const eliminar = async (emp) => {
    const r = await Swal.fire({
      title: '¿Dar de baja al empleado?',
      html: `<b>${emp.nombre}</b><br><small>${emp.cedula_identidad}</small><br><br>` +
            'Ya no podrá ingresar a la plataforma. Su historial (cursos, notas y certificados) se conserva. ' +
            'Si vuelve a la empresa, al agregarlo con la misma cédula se reactiva con su historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;

    setDeletingId(emp.id);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/empleados/${emp.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire('Error', data.message || 'No se pudo eliminar', 'error');
        return;
      }
      setEmpleados(prev => prev.filter(x => x.id !== emp.id));
      Swal.fire({ icon: 'success', title: 'Empleado dado de baja', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const card = { background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 };
  const input = { width: '100%', padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', background: '#f8fafc', color: '#1e293b' };

  return (
    <div>
      <div style={card}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          {editingId !== null ? <Pencil size={18} /> : <UserPlus size={18} />}
          {editingId !== null ? 'Modificar empleado' : 'Agregar nuevo empleado'}
        </div>
        <form onSubmit={agregar} style={{ background: '#e5e6eb', padding: '1.25rem', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', border: '1px solid #c6cbd1', borderRadius: 12 }}>
          <input style={input} name="nombre" placeholder="Apellidos y Nombres" value={form.nombre} onChange={onChange} required maxLength={150} />
          <input style={input} name="cedula_identidad" placeholder="Cédula (10 dígitos)" value={form.cedula_identidad} onChange={onChange} required inputMode="numeric" pattern="\d{10}" title="10 dígitos numéricos" maxLength={10} />
          <input style={input} name="proceso" placeholder="Proceso. Ejm: Producción" value={form.proceso} onChange={onChange} required maxLength={100} />
          <input style={input} name="cargo" placeholder="Cargo. Ejm: Operario/a" value={form.cargo} onChange={onChange} required maxLength={100} />
          <input style={input} name="empresa_socio" placeholder="Empresa: FAMEDIC, MEDICAL SOLUTIONS" value={form.empresa_socio} onChange={(e) => onChange({ ...e, target: { ...e.target, name: e.target.name, value: e.target.value.toUpperCase(), }, }) } required maxLength={100}/>
          <button type="submit" className="btn-agregar-empleado" disabled={saving}>
            {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : '+ Agregar empleado'}
          </button>
          {editingId !== null && (
            <button type="button" className="btn btn-outline-secondary" onClick={cancelarEdicion} disabled={saving}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div style={card}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o proceso..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...input, paddingLeft: 32 }}
            />
          </div>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{filtrados.length} resultado(s)</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={cargar} title="Refrescar"><RefreshCw size={14} /></button>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>}
        {!loading && error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>Nombre</th><th>Cédula</th><th>Proceso</th><th>Cargo</th><th>Empresa</th><th>Registro</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No hay empleados para mostrar.</td></tr>
                ) : filtrados.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.nombre}</td>
                    <td>{emp.cedula_identidad}</td>
                    <td>{emp.proceso || '—'}</td>
                    <td>{emp.cargo || '—'}</td>
                    <td>{emp.empresa_socio || '—'}</td>
                    <td>{emp.fecha_registro ? new Date(emp.fecha_registro).toLocaleDateString('es-EC') : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-outline-primary btn-sm me-1"
                        onClick={() => editar(emp)}
                        title="Modificar empleado"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => eliminar(emp)}
                        disabled={deletingId === emp.id}
                        title="Eliminar empleado"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

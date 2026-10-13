import { useCallback, useEffect, useState } from 'react';
import '../styles/components/CapacitadorManager.css';

export default function CapacitadoresManager() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');
  const [capacitadores, setCapacitadores] = useState([]);
  const [form, setForm] = useState({ nombre: '', cedula: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargarCapacitadores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/procesos/capacitadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudieron cargar los capacitadores');
      setCapacitadores(result.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    cargarCapacitadores();
  }, [cargarCapacitadores]);

  const crearCapacitador = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/procesos/capacitadores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo crear el capacitador');
      setForm({ nombre: '', cedula: '', password: '' });
      await cargarCapacitadores();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (capacitador) => {
    setError('');
    try {
      const response = await fetch(
        `${API_URL}/api/auth/procesos/capacitadores/${capacitador.id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ activo: !capacitador.activo }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo actualizar la cuenta');
      setCapacitadores((current) => current.map((item) => (
        item.id === capacitador.id ? result.data : item
      )));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return (
    <section className="contenedor-capacitador-manager">
      <div className="subcontenedor-capacitador">
        <div className="columna-capacitador">
          <div className="tarjeta-ingreso-capacitador">
            <div className="card-body">
              <h2 className="titulo-tarjeta-capacitador">Crear capacitador</h2>
              <p className="text-muted">
                El capacitador quedará asociado a tu proceso y solo gestionará sus propios cursos.
              </p>
              <form onSubmit={crearCapacitador}>
                <label className="form-label" htmlFor="capacitador-nombre">Nombre</label>
                <input
                  id="capacitador-nombre"
                  className="form-control mb-3"
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                  required
                />
                <label className="form-label" htmlFor="capacitador-cedula">Cédula / usuario</label>
                <input
                  id="capacitador-cedula"
                  className="form-control mb-3"
                  value={form.cedula}
                  onChange={(event) => setForm({ ...form, cedula: event.target.value })}
                  required
                />
                <label className="form-label" htmlFor="capacitador-password">Contraseña inicial</label>
                <input
                  id="capacitador-password"
                  type="password"
                  minLength={6}
                  className="form-control mb-3"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
                <button className="btn-crear-cuenta-capacitador" type="submit" disabled={saving}>
                  {saving ? 'Creando…' : 'Crear cuenta'}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="columna-capacitador">
          <div className="tarjeta-ingreso-capacitador">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="titulo-tarjeta-capacitador">Cuentas del proceso</h2>
                <button className="btn-actualizar-capacitadores" onClick={cargarCapacitadores}>
                  Actualizar
                </button>
              </div>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              {loading ? (
                <p className="text-muted mb-0">Cargando cuentas…</p>
              ) : capacitadores.length === 0 ? (
                <p className="text-muted mb-0">Aún no hay capacitadores registrados.</p>
              ) : (
                <div className="tabla-capacitadores-ingresados">
                  <table className="tabla-capacitadores-registrados">
                    <thead>
                      <tr><th>Nombre</th><th>Usuario</th><th>Estado</th><th /></tr>
                    </thead>
                    <tbody>
                      {capacitadores.map((capacitador) => (
                        <tr key={capacitador.id}>
                          <td>{capacitador.nombre}</td>
                          <td>{capacitador.cedula}</td>
                          <td>{capacitador.activo ? 'Activo' : 'Desactivado'}</td>
                          <td className="text-end">
                            <button
                              className={`btn btn-sm ${capacitador.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => cambiarEstado(capacitador)}
                            >
                              {capacitador.activo ? 'Desactivar' : 'Activar'}
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
        </div>
      </div>
    </section>
  );
}

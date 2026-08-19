import { useState, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/components/crucigrama.css';

function generarLayout(pistasRaw) {
  if (!pistasRaw.length) return { colocadas: [], noColocadas: [] };

  // Normalizar respuestas a mayúsculas sin espacios
  const palabras = pistasRaw.map((p, i) => ({
    ...p,
    respuesta: p.respuesta.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/gi, ''),
    _idx: i,
  })).filter(p => p.respuesta.length > 0);

  if (palabras.length === 0) return { colocadas: [], noColocadas: pistasRaw };

  // Ordenar por longitud descendente
  palabras.sort((a, b) => b.respuesta.length - a.respuesta.length);

  const grid = {}; 
  const placed = [];

  const getCell = (r, c) => grid[`${r},${c}`] ?? null;
  const setCell = (r, c, l) => { grid[`${r},${c}`] = l; };

  function canPlace(word, row, col, dir) {
    const dR = dir === 'V' ? 1 : 0;
    const dC = dir === 'H' ? 1 : 0;
    const pR = 1 - dR; 
    const pC = 1 - dC;

    if (getCell(row - dR, col - dC) !== null) return false;
    // No letter immediately after end
    if (getCell(row + word.length * dR, col + word.length * dC) !== null) return false;

    for (let i = 0; i < word.length; i++) {
      const r = row + i * dR;
      const c = col + i * dC;
      const existing = getCell(r, c);
      if (existing !== null) {
        if (existing !== word[i]) return false;
        // Intersection point — ok, no perpendicular check needed
      } else {
        // Empty cell: check perpendicular neighbors (no parallel words allowed)
        if (getCell(r + pR, c + pC) !== null) return false;
        if (getCell(r - pR, c - pC) !== null) return false;
      }
    }
    return true;
  }

  function placeWord(word, row, col, dir) {
    const dR = dir === 'V' ? 1 : 0;
    const dC = dir === 'H' ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
      setCell(row + i * dR, col + i * dC, word[i]);
    }
  }

  function countIntersections(word, row, col, dir) {
    const dR = dir === 'V' ? 1 : 0;
    const dC = dir === 'H' ? 1 : 0;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (getCell(row + i * dR, col + i * dC) === word[i]) count++;
    }
    return count;
  }

  // Place first word horizontally
  const first = palabras[0];
  placeWord(first.respuesta, 0, 0, 'H');
  placed.push({ ...first, direccion: 'H', fila: 0, columna: 0 });

  // Try to place remaining words
  for (let i = 1; i < palabras.length; i++) {
    const word = palabras[i];
    let best = null;
    let bestScore = -1;

    for (const pw of placed) {
      const oppDir = pw.direccion === 'H' ? 'V' : 'H';
      const pwDr = pw.direccion === 'V' ? 1 : 0;
      const pwDc = pw.direccion === 'H' ? 1 : 0;
      const newDr = oppDir === 'V' ? 1 : 0;
      const newDc = oppDir === 'H' ? 1 : 0;

      for (let wi = 0; wi < word.respuesta.length; wi++) {
        for (let pj = 0; pj < pw.respuesta.length; pj++) {
          if (word.respuesta[wi] === pw.respuesta[pj]) {
            const crossR = pw.fila + pj * pwDr;
            const crossC = pw.columna + pj * pwDc;
            const startR = crossR - wi * newDr;
            const startC = crossC - wi * newDc;

            if (canPlace(word.respuesta, startR, startC, oppDir)) {
              const score = countIntersections(word.respuesta, startR, startC, oppDir);
              if (score > bestScore) {
                bestScore = score;
                best = { row: startR, col: startC, dir: oppDir };
              }
            }
          }
        }
      }
    }

    if (best) {
      placeWord(word.respuesta, best.row, best.col, best.dir);
      placed.push({ ...word, direccion: best.dir, fila: best.row, columna: best.col });
    }
  }

  // Normalize coordinates to start at (0,0)
  const minR = Math.min(...placed.map(p => p.fila));
  const minC = Math.min(...placed.map(p => p.columna));
  const normalized = placed.map(p => ({
    ...p,
    fila: p.fila - minR,
    columna: p.columna - minC,
  }));

  // Find unplaced words
  const placedIdxs = new Set(normalized.map(p => p._idx));
  const noColocadas = pistasRaw.filter((_, i) => !placedIdxs.has(palabras.find((_, ii) => ii < i)?.['_idx']));
  // Simpler: compare by original index
  const placedOrigIdxs = new Set(normalized.map(p => p._idx));
  const noColocadasFinal = pistasRaw.filter((_, i) => {
    const word = palabras.find(p => p._idx === i);
    return word && !placedOrigIdxs.has(i);
  });

  return { colocadas: normalized, noColocadas: noColocadasFinal };
}

// ── Grid preview component ────────────────────────────────────────────────────
function GridPreview({ colocadas }) {
  if (!colocadas.length) return null;

  const maxRow = Math.max(...colocadas.map(p => p.fila + (p.direccion === 'V' ? p.respuesta.length - 1 : 0)));
  const maxCol = Math.max(...colocadas.map(p => p.columna + (p.direccion === 'H' ? p.respuesta.length - 1 : 0)));

  const cellMap = {};
  const withNum = [...colocadas].sort((a, b) => {
    if (a.fila !== b.fila) return a.fila - b.fila;
    return a.columna - b.columna;
  });
  let num = 1;
  const numMap = {};
  for (const p of withNum) {
    const key = `${p.fila},${p.columna}`;
    if (!numMap[key]) numMap[key] = num++;
  }

  for (const p of colocadas) {
    const dR = p.direccion === 'V' ? 1 : 0;
    const dC = p.direccion === 'H' ? 1 : 0;
    for (let i = 0; i < p.respuesta.length; i++) {
      const r = p.fila + i * dR;
      const c = p.columna + i * dC;
      const k = `${r},${c}`;
      if (!cellMap[k]) cellMap[k] = { letter: p.respuesta[i], number: null };
    }
  }
  for (const [key, num] of Object.entries(numMap)) {
    if (cellMap[key]) cellMap[key].number = num;
  }

  const rows = maxRow + 1;
  const cols = maxCol + 1;

  return (
    <div className="crucigrama-preview-wrapper">
      <div className="crucigrama-preview-label">Vista previa del crucigrama</div>
      <div
        className="crucigrama-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 36px)`, gridTemplateRows: `repeat(${rows}, 36px)` }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const cell = cellMap[`${r},${c}`];
            if (!cell) return <div key={`${r}-${c}`} className="crucigrama-celda celda-vacia" />;
            return (
              <div key={`${r}-${c}`} className="crucigrama-celda celda-letra">
                {cell.number && <span className="celda-numero">{cell.number}</span>}
                <span className="celda-letra-preview">{cell.letter}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CrucigramaBuilder({ evaluacionId, pistasIniciales = [], onGuardado }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('admin_token');

  const [pistas, setPistas] = useState(
    pistasIniciales.length > 0
      ? pistasIniciales
      : [{ pista: '', respuesta: '' }]
  );
  const [layout, setLayout] = useState(null); // {colocadas, noColocadas}
  const [guardando, setGuardando] = useState(false);

  const handlePistaChange = (idx, field, value) => {
    setPistas(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
    setLayout(null); // reset layout on change
  };

  const agregarPista = () => {
    setPistas(prev => [...prev, { pista: '', respuesta: '' }]);
    setLayout(null);
  };

  const eliminarPista = (idx) => {
    setPistas(prev => prev.filter((_, i) => i !== idx));
    setLayout(null);
  };

  const handleGenerarLayout = useCallback(() => {
    const pistasValidas = pistas.filter(p => p.pista.trim() && p.respuesta.trim());
    if (pistasValidas.length < 2) {
      Swal.fire('Faltan pistas', 'Necesitas al menos 2 pistas con pista y respuesta completas.', 'warning');
      return;
    }
    const result = generarLayout(pistasValidas);
    setLayout(result);
    if (result.noColocadas.length > 0) {
      Swal.fire({
        title: 'Algunas palabras no se pudieron colocar',
        html: `Las siguientes palabras no encontraron cruce disponible:<br><strong>${result.noColocadas.map(p => p.respuesta).join(', ')}</strong><br><br>Puedes intentar agregar palabras que compartan más letras.`,
        icon: 'warning',
      });
    }
  }, [pistas]);

  const handleGuardar = async () => {
    if (!layout || layout.colocadas.length === 0) {
      Swal.fire('Primero genera el diseño', 'Haz clic en "Generar crucigrama" antes de guardar.', 'info');
      return;
    }

    // Assign numbers based on position (top-left order)
    const sorted = [...layout.colocadas].sort((a, b) => {
      if (a.fila !== b.fila) return a.fila - b.fila;
      return a.columna - b.columna;
    });
    const numMap = {};
    let num = 1;
    for (const p of sorted) {
      const key = `${p.fila},${p.columna}`;
      if (!numMap[key]) numMap[key] = num++;
    }

    const payload = layout.colocadas.map(p => ({
      numero: numMap[`${p.fila},${p.columna}`],
      pista: p.pista,
      respuesta: p.respuesta,
      direccion: p.direccion,
      fila: p.fila,
      columna: p.columna,
    }));

    try {
      setGuardando(true);
      const res = await fetch(`${API_URL}/api/evaluaciones/${evaluacionId}/crucigrama-pistas/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pistas: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire('Guardado', 'El crucigrama fue guardado correctamente.', 'success');
      onGuardado?.();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="crucigrama-builder">
      <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.85rem' }}>
        <strong>¿Cómo crear el crucigrama?</strong> Ingresa cada palabra y su definición/pista, luego haz clic en <em>"Generar crucigrama"</em> para que el sistema ubique las palabras automáticamente.
      </div>

      {/* Lista de pistas */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label fw-semibold mb-0">Palabras y definiciones</label>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>{pistas.filter(p => p.respuesta.trim()).length} palabras</span>
        </div>

        {/* Header */}
        <div className="crucigrama-pista-row" style={{ background: '#e9ecef', fontWeight: 600, fontSize: '0.8rem', color: '#495057' }}>
          <span>Definición / Pista</span>
          <span>Respuesta (palabra)</span>
          <span></span>
        </div>

        <div className="crucigrama-pistas-lista">
          {pistas.map((p, idx) => (
            <div key={idx} className="crucigrama-pista-row">
              <input
                type="text"
                placeholder="Aquí escribe la pregunta"
                value={p.pista}
                onChange={e => handlePistaChange(idx, 'pista', e.target.value)}
              />
              <input
                type="text"
                className="respuesta-input"
                placeholder="Aquí escribe la respuesta"
                value={p.respuesta}
                onChange={e => handlePistaChange(idx, 'respuesta', e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <button
                type="button"
                className="btn-eliminar-pista"
                onClick={() => eliminarPista(idx)}
                disabled={pistas.length <= 1}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-agregar-pista"
          onClick={agregarPista}
        >
          <Plus size={13} /> Agregar palabra
        </button>
      </div>

      {/* Acciones */}
      <div className="crucigrama-acciones">
        <button
          type="button"
          className="btn btn-warning d-flex align-items-center gap-2"
          onClick={handleGenerarLayout}
        >
          <RefreshCw size={15} />
          Generar crucigrama
        </button>
        {layout && layout.colocadas.length > 0 && (
          <button
            type="button"
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={handleGuardar}
            disabled={guardando}
          >
            <Save size={15} />
            {guardando ? 'Guardando...' : 'Guardar crucigrama'}
          </button>
        )}
      </div>

      {/* No colocadas */}
      {layout && layout.noColocadas.length > 0 && (
        <div className="no-colocadas-alert d-flex gap-2 align-items-start">
          <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
          <div>
            <strong>No se pudo colocar:</strong>{' '}
            {layout.noColocadas.map(p => p.respuesta).join(', ')}. Intenta usar palabras que compartan letras con las ya colocadas.
          </div>
        </div>
      )}

      {/* Preview */}
      {layout && layout.colocadas.length > 0 && (
        <GridPreview colocadas={layout.colocadas} />
      )}
    </div>
  );
}

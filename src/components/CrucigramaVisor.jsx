import { useState, useRef, useCallback } from 'react';
import '../styles/components/crucigrama.css';

/**
 * CrucigramaVisor
 * Renderiza el crucigrama interactivo para que el usuario lo resuelva.
 * Props:
 *   pistas  — array con { id, numero, pista, direccion, fila, columna, longitud }
 */
export default function CrucigramaVisor({ pistas, onSubmit, disabled = false }) {
  const inputRefs = useRef({});
  const [cellValues, setCellValues] = useState({}); // "r,c" -> letter
  const [selectedPista, setSelectedPista] = useState(null); // id of selected pista
  const [selectedCell, setSelectedCell] = useState(null);   // "r,c"

  // ── Build cell map ─────────────────────────────────────────
  const cellMap = {}; // "r,c" -> { numbers: [], pistaH: id|null, pistaV: id|null }
  for (const p of pistas) {
    const dR = p.direccion === 'V' ? 1 : 0;
    const dC = p.direccion === 'H' ? 1 : 0;
    for (let i = 0; i < p.longitud; i++) {
      const r = p.fila + i * dR;
      const c = p.columna + i * dC;
      const key = `${r},${c}`;
      if (!cellMap[key]) cellMap[key] = { numbers: [], pistaH: null, pistaV: null };
      if (i === 0) cellMap[key].numbers.push(p.numero);
      if (p.direccion === 'H') cellMap[key].pistaH = p.id;
      else cellMap[key].pistaV = p.id;
    }
  }

  const maxRow = pistas.length
    ? Math.max(...pistas.map(p => p.fila + (p.direccion === 'V' ? p.longitud - 1 : 0)))
    : 0;
  const maxCol = pistas.length
    ? Math.max(...pistas.map(p => p.columna + (p.direccion === 'H' ? p.longitud - 1 : 0)))
    : 0;

  // ── Get cells of a pista in order ──────────────────────────
  const getCeldas = useCallback((pista) => {
    const dR = pista.direccion === 'V' ? 1 : 0;
    const dC = pista.direccion === 'H' ? 1 : 0;
    return Array.from({ length: pista.longitud }, (_, i) => ({
      r: pista.fila + i * dR,
      c: pista.columna + i * dC,
    }));
  }, []);

  // ── Get pista object by id ─────────────────────────────────
  const getPista = id => pistas.find(p => p.id === id);

  // ── Handle cell click ──────────────────────────────────────
  const handleCellClick = (r, c, cell) => {
    if (disabled) return;
    const key = `${r},${c}`;
    setSelectedCell(key);

    // Determine which pista to activate
    if (selectedCell === key && cell.pistaH && cell.pistaV) {
      // Toggle direction on second click
      const current = getPista(selectedPista);
      if (current?.id === cell.pistaH) setSelectedPista(cell.pistaV);
      else setSelectedPista(cell.pistaH);
    } else if (selectedPista) {
      const current = getPista(selectedPista);
      if (current) {
        const cells = getCeldas(current);
        const inCurrentPista = cells.some(cc => cc.r === r && cc.c === c);
        if (inCurrentPista) {
          // Keep current direction
        } else if (cell.pistaH && getPista(cell.pistaH)) {
          setSelectedPista(cell.pistaH);
        } else if (cell.pistaV && getPista(cell.pistaV)) {
          setSelectedPista(cell.pistaV);
        }
      } else {
        setSelectedPista(cell.pistaH || cell.pistaV);
      }
    } else {
      setSelectedPista(cell.pistaH || cell.pistaV);
    }

    // Focus the input
    setTimeout(() => inputRefs.current[key]?.focus(), 10);
  };

  // ── Handle pista click in list ─────────────────────────────
  const handlePistaClick = (pista) => {
    setSelectedPista(pista.id);
    const celdas = getCeldas(pista);
    const firstKey = `${celdas[0].r},${celdas[0].c}`;
    setSelectedCell(firstKey);
    setTimeout(() => inputRefs.current[firstKey]?.focus(), 10);
  };

  // ── Handle key input in a cell ─────────────────────────────
  const handleKeyDown = (e, r, c) => {
    if (disabled) return;
    const key = `${r},${c}`;
    const cell = cellMap[key];
    if (!cell) return;

    const pista = getPista(selectedPista) || getPista(cell.pistaH || cell.pistaV);
    if (!pista) return;

    const dR = pista.direccion === 'V' ? 1 : 0;
    const dC = pista.direccion === 'H' ? 1 : 0;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (cellValues[key]) {
        setCellValues(prev => { const n = { ...prev }; delete n[key]; return n; });
      } else {
        // Move to previous cell
        const prevKey = `${r - dR},${c - dC}`;
        if (cellMap[prevKey]) {
          setCellValues(prev => { const n = { ...prev }; delete n[prevKey]; return n; });
          setSelectedCell(prevKey);
          setTimeout(() => inputRefs.current[prevKey]?.focus(), 10);
        }
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      let nr = r, nc = c;
      if (e.key === 'ArrowRight') nc++;
      else if (e.key === 'ArrowLeft') nc--;
      else if (e.key === 'ArrowDown') nr++;
      else if (e.key === 'ArrowUp') nr--;
      const nextKey = `${nr},${nc}`;
      if (cellMap[nextKey]) {
        setSelectedCell(nextKey);
        setTimeout(() => inputRefs.current[nextKey]?.focus(), 10);
      }
    }
  };

  const handleInput = (e, r, c) => {
    if (disabled) return;
    const key = `${r},${c}`;
    const cell = cellMap[key];
    if (!cell) return;

    const letter = e.target.value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ]/gi, '').slice(-1).toUpperCase();

    setCellValues(prev => ({ ...prev, [key]: letter }));

    // Move to next cell in active pista direction
    const pista = getPista(selectedPista) || getPista(cell.pistaH || cell.pistaV);
    if (pista && letter) {
      const dR = pista.direccion === 'V' ? 1 : 0;
      const dC = pista.direccion === 'H' ? 1 : 0;
      const nextKey = `${r + dR},${c + dC}`;
      if (cellMap[nextKey]) {
        setSelectedCell(nextKey);
        setTimeout(() => {
          inputRefs.current[nextKey]?.focus();
          inputRefs.current[nextKey]?.select();
        }, 10);
      }
    }
  };

  // ── Build answers for submit ───────────────────────────────
  const buildRespuestas = () => {
    const respuestas = {};
    for (const pista of pistas) {
      const dR = pista.direccion === 'V' ? 1 : 0;
      const dC = pista.direccion === 'H' ? 1 : 0;
      let answer = '';
      for (let i = 0; i < pista.longitud; i++) {
        const r = pista.fila + i * dR;
        const c = pista.columna + i * dC;
        answer += cellValues[`${r},${c}`] || '';
      }
      respuestas[pista.id] = answer.toUpperCase().trim();
    }
    return respuestas;
  };

  const handleSubmit = () => {
    const respuestas = buildRespuestas();
    const incompletas = pistas.filter(p => {
      const r = respuestas[p.id] || '';
      return r.length < p.longitud;
    });
    onSubmit?.(respuestas, incompletas);
  };

  // ── Check if cell is part of active pista ─────────────────
  const isInActivePista = (r, c) => {
    if (!selectedPista) return false;
    const pista = getPista(selectedPista);
    if (!pista) return false;
    return getCeldas(pista).some(cc => cc.r === r && cc.c === c);
  };

  // ── Separate pistas by direction for the list ──────────────
  const pistasH = pistas.filter(p => p.direccion === 'H').sort((a, b) => a.numero - b.numero);
  const pistasV = pistas.filter(p => p.direccion === 'V').sort((a, b) => a.numero - b.numero);

  const rows = maxRow + 1;
  const cols = maxCol + 1;

  return (
    <div className="crucigrama-visor-wrap">
      {/* Grid */}
      <div className="crucigrama-preview-wrapper">
        <div
          className="crucigrama-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 36px)`,
            gridTemplateRows: `repeat(${rows}, 36px)`,
          }}
        >
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const key = `${r},${c}`;
              const cell = cellMap[key];
              if (!cell) return <div key={key} className="crucigrama-celda celda-vacia" />;

              const isSelected = selectedCell === key;
              const inActive = isInActivePista(r, c);
              const letter = cellValues[key] || '';

              return (
                <div
                  key={key}
                  className={`crucigrama-celda celda-letra${isSelected ? ' activa-celda' : ''}${inActive && !isSelected ? ' pista-activa' : ''}`}
                  onClick={() => handleCellClick(r, c, cell)}
                >
                  {cell.numbers.length > 0 && (
                    <span className="celda-numero">{cell.numbers[0]}</span>
                  )}
                  <input
                    ref={el => { inputRefs.current[key] = el; }}
                    className="celda-input"
                    type="text"
                    value={letter}
                    maxLength={2}
                    readOnly={disabled}
                    onFocus={() => { setSelectedCell(key); }}
                    onChange={e => handleInput(e, r, c)}
                    onKeyDown={e => handleKeyDown(e, r, c)}
                    aria-label={`Celda fila ${r + 1} columna ${c + 1}`}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clue list */}
      <div className="crucigrama-pistas-panel w-100" style={{ maxWidth: `${cols * 38}px` }}>
        {pistasH.length > 0 && (
          <div className="crucigrama-pistas-grupo">
            <h6>Horizontales</h6>
            <ol>
              {pistasH.map(p => (
                <li
                  key={p.id}
                  className={selectedPista === p.id ? 'pista-activa-item' : ''}
                  onClick={() => handlePistaClick(p)}
                >
                  <span className="pista-num-badge">{p.numero}</span>
                  {p.pista}
                </li>
              ))}
            </ol>
          </div>
        )}
        {pistasV.length > 0 && (
          <div className="crucigrama-pistas-grupo">
            <h6>Verticales</h6>
            <ol>
              {pistasV.map(p => (
                <li
                  key={p.id}
                  className={selectedPista === p.id ? 'pista-activa-item' : ''}
                  onClick={() => handlePistaClick(p)}
                >
                  <span className="pista-num-badge">{p.numero}</span>
                  {p.pista}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Submit */}
      {!disabled && (
        <button
          className="btn btn-primary w-100"
          style={{ maxWidth: '300px' }}
          onClick={handleSubmit}
        >
          Enviar crucigrama
        </button>
      )}
    </div>
  );
}

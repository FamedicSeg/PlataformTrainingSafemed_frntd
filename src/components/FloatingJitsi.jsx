import React, { useState, useEffect } from 'react';
import { useJitsi } from '../context/JitsiContext';
import SalaJitsiMeet from './SalaJitsiMeet';
import { Minimize2, Maximize2, X } from 'lucide-react';
import '../styles/components/floatingJitsi.css';

export default function FloatingJitsi() {
  const { jitsiSession, isMinimized, toggleMinimize, endJitsiSession } = useJitsi();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!jitsiSession) return null;

  const handleMouseDown = (e) => {
    if (e.target.closest('.floating-header')) {
      setIsDragging(true);
      const rect = document.querySelector('.floating-jitsi-container').getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      className={`floating-jitsi-container ${isMinimized ? 'minimized' : 'expanded'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header arrastrable */}
      <div className="floating-header">
        <span className="header-title">🎥 {jitsiSession.nombreCurso}</span>
        <div className="header-buttons">
          <button
            className="btn-action"
            onClick={toggleMinimize}
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? (
              <Maximize2 size={16} />
            ) : (
              <Minimize2 size={16} />
            )}
          </button>
          <button
            className="btn-action btn-close"
            onClick={() => endJitsiSession()}
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      {!isMinimized && (
        <div className="floating-content">
          <SalaJitsiMeet
            cursoId={jitsiSession.cursoId}
            nombreCurso={jitsiSession.nombreCurso}
            userEmail={jitsiSession.userEmail}
            userName={jitsiSession.userName}
            fechaInicio={jitsiSession.fechaInicio}
            isFloating={true}
          />
        </div>
      )}

      {/* Indicador cuando está minimizado */}
      {isMinimized && (
        <div className="minimized-indicator">
          <span className="pulse"></span>
          En sesión...
        </div>
      )}
    </div>
  );
}

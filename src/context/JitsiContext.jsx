import React, { createContext, useState, useContext } from 'react';

// Crear contexto
const JitsiContext = createContext();

// Provider component
export function JitsiProvider({ children }) {
  const [jitsiSession, setJitsiSession] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const startJitsiSession = (sessionData) => {
    console.log('🎥 Iniciando sesión Jitsi:', sessionData);
    setJitsiSession(sessionData);
    setIsMinimized(false);
  };

  const endJitsiSession = () => {
    console.log('❌ Finalizando sesión Jitsi');
    setJitsiSession(null);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <JitsiContext.Provider
      value={{
        jitsiSession,
        startJitsiSession,
        endJitsiSession,
        isMinimized,
        toggleMinimize
      }}
    >
      {children}
    </JitsiContext.Provider>
  );
}

// Hook para usar el contexto
export function useJitsi() {
  const context = useContext(JitsiContext);
  if (!context) {
    throw new Error('useJitsi debe ser usado dentro de JitsiProvider');
  }
  return context;
}

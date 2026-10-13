import React from 'react';
import CursoFormAsincronico from './CursoFormAsincronico';

export default function CursoForm({ cursoId = null, onSave, onCancel, initialData = null }) {
  return (
    <div className="curso-form-wrapper">
      <CursoFormAsincronico
        cursoId={cursoId}
        onSave={onSave}
        onCancel={onCancel}
        initialData={initialData}
      />
    </div>
  );
}

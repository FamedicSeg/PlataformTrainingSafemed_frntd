# Solución: Cursos no se marcan como completados sin evaluación aprobada

## ❌ Problema Original
Los cursos que contenían una **evaluación (prueba)** se marcaban como **"✅ Completado"** incluso cuando el estudiante:
- Completaba todos los módulos
- **NO había aprobado la evaluación**

Esto permitía que los estudiantes mostraran cursos completados sin realmente haberlos terminado correctamente.

---

## ✅ Solución Implementada

### 1. **Frontend - visorCurso.jsx** (Carga del curso)

Cuando el usuario **abre un curso dinámico**:

```javascript
// Verificar si hay evaluación
let hayEvaluacion = false;
const evaluacionRes = await fetch(`${API_URL}/api/evaluaciones/curso/${cursoId}`);
const evaluacionData = await evaluacionRes.json();
hayEvaluacion = evaluacionData.data?.length > 0;

// CRÍTICO: Si el curso está marcado como completado pero la evaluación NO fue aprobada
if (hayEvaluacion && inscripcionCurso.estado === 'completado' && !inscripcionCurso.evaluacion_aprobada) {
  // Revertir INMEDIATAMENTE a 'en progreso'
  await fetch(`${API_URL}/api/inscripciones/${inscripcionCurso.id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado: 'en progreso' })
  });
}
```

**Resultado**: Si el sistema de algún modo marcó el curso como completado sin evaluación aprobada, se **revierte automáticamente** al entrar.

### 2. **Frontend - visorCurso.jsx** (Bloqueo de auto-completion)

Cuando el usuario **completa todos los módulos** (`progreso === 100`):

```javascript
useEffect(() => {
  if (progreso === 100 && !loading && !cursoMarcadoCompletado && inscripcion) {
    // Si hay evaluación BLOQUEADA: no marcar automáticamente
    if (tieneEvaluacion) {
      console.log('📋 Evaluación encontrada. Esperando a que sea aprobada...');
      return; // NO marca como completado
    }
    
    // Solo si NO hay evaluación, marcar como completado
    await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: 'completado' })
    });
  }
}, [progreso, tieneEvaluacion, ...]); // tieneEvaluacion en dependency array
```

**Resultado**: El curso **NO se marca como completado automáticamente** si tiene evaluación pendiente.

### 3. **Frontend - cursosDisponibles.jsx** (Actualización de estado)

Se agregó un listener que **refresca la página de cursos** cuando el usuario **vuelve después de ver un curso**:

```javascript
useEffect(() => {
  cargarDatos();
  
  // Refresca cuando el usuario vuelve a esta página (desde visorCurso)
  const handleFocus = () => {
    console.log('👁️ Usuario volvió a la página, refrescando cursos...');
    cargarDatos();
  };
  
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

**Resultado**: La tarjeta de cursos **se actualiza automáticamente** al volver, mostrando el estado correcto.

### 4. **Frontend - Páginas de procesos** (cursosDisponibles.jsx, cursosTTHH.jsx, etc.)

La lógica que determina si un curso está completado ahora verifica:

```javascript
const tieneEvaluacionPendiente = (cap) => {
  return cap.estado === 'completado' && (cap.mejor_puntaje === null || !cap.evaluacion_aprobada);
};
```

Si hay evaluación pendiente, se muestra:
- **Badge naranja**: "⏳ Evaluación pendiente"
- **Botón**: "Completar Evaluación"
- **NO** se muestra verde: "✅ Completado"

### 5. **Backend - inscripciones.js** (Validación)

El endpoint `PUT /api/inscripciones/{id}` verifica antes de permitir marcar como completado:

```javascript
if (!esAdmin && estado === 'completado') {
  // Verificar si hay evaluación
  const [evaluaciones] = await db.query(
    `SELECT id FROM evaluaciones WHERE curso_id = $1 LIMIT 1`,
    [inscripcion.curso_id]
  );
  
  if (evaluaciones.length > 0) {
    // Hay evaluación, verificar si fue aprobada
    const [intentos] = await db.query(
      `SELECT id, aprobado FROM intentos_evaluacion 
       WHERE usuario_id = $1 AND curso_id = $2 AND aprobado = true
       ORDER BY fecha_intento DESC LIMIT 1`,
      [inscripcion.usuario_id, inscripcion.curso_id]
    );
    
    if (intentos.length === 0) {
      // No aprobada → error 400
      return res.status(400).json({
        success: false,
        message: "No puedes marcar el curso como completado sin aprobar la evaluación final"
      });
    }
  }
}
```

**Resultado**: El backend **rechaza cualquier intento** de marcar como completado sin evaluación aprobada.

---

## 🔄 Flujo de Validación (3 capas de seguridad)

```
┌─────────────────────────────────────────────────────────┐
│ CAPA 1: FRONTEND (visorCurso.jsx)                       │
│ - Bloquea auto-completion si tieneEvaluacion = true     │
│ - Revierte si estaba incorrectamente marcado            │
└───────────────────┬───────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│ CAPA 2: BACKEND (inscripciones.js)                      │
│ - Rechaza con 400 si se intenta marcar sin aprobación   │
└───────────────────┬───────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│ CAPA 3: REFRESCO AUTOMÁTICO (cursosDisponibles.jsx)     │
│ - Al volver: recargan datos del API                     │
│ - Se muestra estado correcto en tarjetas                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comportamiento Esperado por Caso

### Caso 1: Curso SIN Evaluación
```
Usuario completa módulos → progreso = 100%
↓
Sistema marca automáticamente: ✅ Completado
↓
Tarjeta muestra: "✅ Curso realizado"
```

### Caso 2: Curso CON Evaluación (Sin Aprobar)
```
Usuario completa módulos → progreso = 100%
↓
Sistema BLOQUEADO: ¡No marca como completado!
↓
Consola muestra: "📋 Evaluación encontrada. Esperando a que sea aprobada..."
↓
Tarjeta muestra: "⏳ Evaluación pendiente" (naranja)
```

### Caso 3: Curso CON Evaluación (Aprobada)
```
Usuario completa módulos → progreso = 100%
↓
Evaluación aprobada: evalua cion_aprobada = true
↓
Sistema marca automáticamente: ✅ Completado
↓
Tarjeta muestra: "✅ Curso realizado"
```

---

## 🧪 Cómo Probar

### Test Local

1. **Como Admin de Talento Humano**:
   - Crear un curso dinámico **con evaluación** (2+ preguntas, calificación mínima)
   - Asignar a un estudiante

2. **Como Estudiante**:
   - Ir al curso
   - Completar todos los módulos
   - Verificar en consola (F12):
     ```
     ✅ Evaluación encontrada
     📋 Evaluación encontrada. Esperando a que sea aprobada...
     ```
   - Verificar que la tarjeta muestra **"⏳ Evaluación pendiente"**
   - NO debería mostrar **"✅ Completado"**

3. **Dar la evaluación**:
   - Intentar responder (sin importar si aprueba o no)
   - Volver a la página de cursos
   - Si **NO aprobó**: Sigue mostrando "⏳ Evaluación pendiente"
   - Si **SÍ aprobó**: Ahora muestra "✅ Completado"

---

## 📁 Archivos Modificados

### Frontend
- **visorCurso.jsx**: Reversión de estado + Bloqueo de auto-completion
- **cursosDisponibles.jsx**: Auto-refresh con listener de focus
- **cursosTTHH.jsx** (y otros procesos): Lógica de tieneEvaluacionPendiente

### Backend
- **inscripciones.js**: Validación antes de marcar como completado (línea ~498)

---

## 🔧 Commits Relacionados

```
✅ Fix: Revert course status if marked complete but evaluation not approved
   - Check evaluation when loading visorCurso
   - Revert to 'en progreso' if needed
   - Block auto-completion if evaluation exists

✅ Refactor: Add auto-refresh when user returns to course pages
   - Window focus listener in cursosDisponibles.jsx
   - Updates course status automatically
```

---

## ⚠️ Notas Importantes

1. **Reversión solo en frontend**: La reversión del estado en visorCurso.jsx ocurre cuando se carga el curso. El estado se actualiza en la BD a través del PUT al API.

2. **Evaluación aprobada define finalización**: La única forma de marcar un curso como completado si tiene evaluación es:
   - Tener `intentos_evaluacion.aprobado = true` PARA ese usuario Y curso

3. **Sincronización de datos**: La página de cursos refresca al volver (focus event), asegurando que ve el estado más actualizado.

4. **Aplica a todos los cursos dinámicos**: Este bloqueo aplica para cursos de cualquier proceso (TTHH, Compras, Ventas, etc.).

---

## 📞 Soporte

Si un curso sigue mostrando como completado incorrectamente:

1. Verificar en BD: `SELECT estado, evaluacion_aprobada FROM inscripciones WHERE usuario_id = ? AND curso_id = ?`
2. Verificar si existe evaluación: `SELECT COUNT(*) FROM evaluaciones WHERE curso_id = ?`
3. Verificar intentos aprobados: `SELECT COUNT(*) FROM intentos_evaluacion WHERE curso_id = ? AND usuario_id = ? AND aprobado = true`

Si todo es correcto en BD pero la UI no se actualiza, recargar la página manualmente.

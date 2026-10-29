# 🐛 Solución: Cursos completados antes de aprobar la evaluación

## Problema Reportado
Los cursos que contienen una prueba (evaluación) se marcaban como **completados** aunque el usuario **NO aprobara** la evaluación.

### Comportamiento Anterior (Incorrecto)
1. Usuario completa todos los módulos del curso ✅
2. `visorCurso.jsx` marca automáticamente el curso como `completado` 🚫
3. Usuario realiza la evaluación pero la **reprueba** ❌
4. El curso sigue marcado como `completado` (incorrecto)

---

## 🔧 Solución Implementada

### Cambio 1: `src/pages/visorCurso.jsx` (líneas 408-443)

**Modificación del `useEffect`:**
- Se agregó una verificación: Si el curso tiene evaluación (`tieneEvaluacion === true`), **NO marcar como completado automáticamente**
- El curso solo se marca como completado cuando:
  - ✅ Se completaron todos los módulos (progreso === 100) **Y**
  - ❌ El curso **NO** tiene evaluación (`tieneEvaluacion === false`)

**Código:**
```javascript
// 🔧 CAMBIO: Solo marcar como completado si NO hay evaluación
// Si hay evaluación, esperar a que se apruebe primero
useEffect(() => {
    const finalizarCurso = async () => {
      if (progreso === 100 && !loading && !cursoMarcadoCompletado && inscripcion) {
        // Si el curso tiene evaluación, NO marcarlo como completado automáticamente
        // Se marcará como completado solo después de que el usuario apruebe la evaluación
        if (tieneEvaluacion) {
          console.log('📋 Evaluación encontrada. Esperando a que sea aprobada...');
          return;  // ← EXIT: No marcar como completado
        }

        // Si NO hay evaluación, marcar como completado de inmediato
        // ... [resto del código]
      }
    };
    finalizarCurso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progreso, loading, cursoMarcadoCompletado, inscripcion, API_URL, token, tieneEvaluacion]);
```

---

### Cambio 2: `src/pages/pruebas.jsx` (líneas 31-72)

**Nuevo `useEffect` agregado:**
- Se ejecuta cuando el usuario **aprueba** la evaluación (`estado.aprobado === true`)
- Marca el curso como `completado` solo después de que se aprueba la evaluación

**Código:**
```javascript
// 🔧 NUEVO: Marcar curso como completado cuando se aprueba la evaluación
useEffect(() => {
    const marcarCursoCompletado = async () => {
        // Solo marcar si la evaluación fue aprobada
        if (estado.aprobado && resultado && resultado.aprobado && cursoId) {
            try {
                const usuario = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
                if (!usuario.id) return;

                // Obtener la inscripción del usuario para este curso
                const inscRes = await fetch(`${API_URL}/api/inscripciones/usuario/${usuario.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const inscData = await inscRes.json();
                const inscripcion = inscData.data?.find(i => i.curso_id === parseInt(cursoId));

                if (inscripcion && inscripcion.estado !== 'completado') {
                    // Marcar el curso como completado
                    const updateRes = await fetch(`${API_URL}/api/inscripciones/${inscripcion.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ estado: 'completado' })
                    });

                    if (updateRes.ok) {
                        console.log('✅ Curso marcado como completado (evaluación aprobada)');
                    }
                }
            } catch (error) {
                console.error('Error al marcar curso como completado:', error);
            }
        }
    };

    marcarCursoCompletado();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [estado.aprobado, resultado]);
```

---

## ✅ Nuevo Flujo Correcto

1. Usuario completa todos los módulos del curso ✅
2. `visorCurso.jsx` detecta evaluación → **NO marca como completado** 🔒
3. Usuario ve el botón "Ir a la Prueba Final" ✅
4. **Opción A:** Usuario aprueba la evaluación → Curso se marca como `completado` ✅
5. **Opción B:** Usuario reprueba la evaluación → Curso sigue sin ser `completado` ✅

---

## 🧪 Casos de Uso

### Caso 1: Curso SIN evaluación
- ✅ Se marca automáticamente como completado cuando todos los módulos están completos
- ✅ Sin cambios en el comportamiento

### Caso 2: Curso CON evaluación (Usuario aprueba)
- ✅ Módulos completados → No se marca como completado (esperando evaluación)
- ✅ Evaluación aprobada → Se marca como completado ✨
- ✅ Se muestra mensaje de éxito

### Caso 3: Curso CON evaluación (Usuario reprueba)
- ✅ Módulos completados → No se marca como completado (esperando evaluación)
- ✅ Evaluación reprobada → Sigue sin estar completado ✅
- ✅ Usuario puede reintentar la evaluación

---

## 🔍 Verificación

Build completado exitosamente sin errores:
```
✓ 2151 modules transformed.
✓ built in 12.25s
```

---

## 📝 Archivos Modificados

1. `src/pages/visorCurso.jsx` - Líneas 408-443
2. `src/pages/pruebas.jsx` - Líneas 31-72

---

## 🎯 Próximas Validaciones

- [ ] Probar con un curso que tiene evaluación
- [ ] Verificar que el estado se actualice correctamente en la base de datos
- [ ] Confirmar que los certificados se generen solo después de aprobar
- [ ] Validar el flujo en cursos sin evaluación


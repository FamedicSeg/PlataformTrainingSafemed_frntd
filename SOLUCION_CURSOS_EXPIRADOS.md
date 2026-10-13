# 🔧 Solución: Problema de Cursos Guardados como Expirados

## 📋 Problema Identificado

Los cursos estaban siendo marcados incorrectamente como **expirados** en el frontend. Esto ocurría porque la comparación de fechas era frágil y no manejaba correctamente diferentes formatos de fecha del backend.

## 🔍 Causa Raíz

El código original usaba:
```javascript
const esCursoExpirado = (cap) => {
  if (!cap.fecha_fin_curso) return false;
  return new Date() > new Date(cap.fecha_fin_curso);
};
```

**Problemas:**
1. ❌ Si el backend devuelve fechas en formato ISO-8601 (ej: `2024-12-31T23:59:59Z`), `new Date()` podría parsearlas incorrectamente
2. ❌ Si la fecha viene como un timestamp inválido, se genera una fecha `Invalid Date`
3. ❌ No hay validación de si el parseo fue exitoso
4. ❌ No hay logging para debugging

## ✅ Solución Implementada

Se creó un módulo reutilizable **`src/utils/dateUtils.js`** con funciones robustas de parseo de fechas:

### Funciones Principales

#### 1. **`parseFecha(dateStr)`**
Parsea cualquier formato de fecha de forma segura:
- Maneja strings ISO-8601
- Maneja timestamps numéricos
- Maneja objetos Date existentes
- Valida que la fecha sea válida
- Retorna `null` si es inválida

```javascript
import { parseFecha } from '../utils/dateUtils';

const fecha = parseFecha(cap.fecha_fin_curso);
if (fecha && fecha > new Date()) {
  // Fecha válida y en el futuro
}
```

#### 2. **`esCursoExpiradoSeguro(fechaFin)`**
Reemplaza la lógica anterior con validación robusta:
```javascript
import { esCursoExpiradoSeguro } from '../utils/dateUtils';

const expirado = esCursoExpiradoSeguro(cap.fecha_fin_curso);
```

#### 3. **`esCursoProximoSeguro(fechaInicio)`**
Verifica si un curso aún no ha iniciado:
```javascript
import { esCursoProximoSeguro } from '../utils/dateUtils';

const proximo = esCursoProximoSeguro(cap.fecha_inicio_curso);
```

#### 4. **`formatearFecha(dateStr, conHora)`**
Formatea fechas consistentemente en locale es-EC:
```javascript
import { formatearFecha } from '../utils/dateUtils';

const textoFecha = formatearFecha(cap.fecha_inicio_curso, true);
// Resultado: "31/12/2024 23:59"
```

#### 5. **`tiempoRestante(fechaFin)`**
Calcula días/horas/minutos restantes:
```javascript
import { tiempoRestante } from '../utils/dateUtils';

const { dias, horas, minutos } = tiempoRestante(cap.fecha_fin_curso);
if (dias === 0 && horas < 2) {
  console.warn('⚠️ Curso expira pronto!');
}
```

## 📝 Cambios Realizados

### Archivos Modificados

1. **`src/utils/dateUtils.js`** ✨ NUEVO
   - Módulo de utilidades de fecha robustas

2. **`src/pages/cursosDisponibles.jsx`**
   - Importa funciones de `dateUtils`
   - Reemplaza `esCursoExpirado()` y `esCursoProximo()` con versiones seguras
   - Usa `formatearFecha()` para consistencia

3. **`src/pages/visorCurso.jsx`**
   - Importa `esCursoExpiradoSeguro`
   - Bloquea acceso a cursos expirados de forma robusta

4. **Archivos de Procesos (17 archivos)**
   ```
   - cursosALogistica.jsx
   - cursosARCC.jsx
   - cursosCompras.jsx
   - cursoSeguridadFisica.jsx
   - cursosGerencia.jsx
   - cursosGestionComercial.jsx
   - cursosInfraMantenimiento.jsx
   - cursosInvestigaciónDesarrollo.jsx
   - cursosMarketing.jsx
   - cursosOperaciones.jsx
   - cursosSaludOc.jsx
   - cursosSegInd.jsx
   - cursosSeguridadInformatica.jsx
   - cursosSGCS.jsx
   - cursosTTHH.jsx
   - cursosVentasCosta.jsx
   - cursosVentasSierra.jsx
   ```

## 🎯 Beneficios

✅ **Robustez**: Maneja múltiples formatos de fecha del backend  
✅ **Validación**: Verifica que las fechas sean válidas antes de usar  
✅ **Reutilización**: Una única fuente de verdad para comparación de fechas  
✅ **Debugging**: Logging de advertencia si una fecha es inválida  
✅ **Consistencia**: Formato de fecha uniforme en toda la app (es-EC)  
✅ **Escalabilidad**: Fácil agregar más funciones de fecha en el futuro  

## 🧪 Pruebas Recomendadas

1. Crear un curso con `fecha_fin_curso` en el pasado → Debe mostrarse como expirado
2. Crear un curso con `fecha_fin_curso` en el futuro → Debe permitir acceso
3. Crear un curso con `fecha_inicio_curso` en el futuro → Debe mostrarse como "Próximamente"
4. Crear un curso sin `fecha_fin_curso` → Debe permitir acceso indefinido
5. Verificar con fechas en diferentes formatos del backend

## 📌 Notas Importantes

- El módulo `dateUtils.js` es independiente y no tiene dependencias externas
- Se puede usar en cualquier componente que necesite comparar fechas
- Las funciones están bien documentadas con JSDoc
- El error de compilación de Jitsi es previo a estos cambios y no está relacionado

## 🚀 Próximos Pasos

1. Probar en el ambiente de desarrollo
2. Verificar que los cursos se muestren/oculten correctamente según sus fechas
3. Revisar los logs de la consola para cualquier fecha inválida
4. Si todo funciona, hacer deploy a producción

---

**Fecha de implementación**: 13 de Octubre de 2026  
**Archivos actualizados**: 20  
**Nuevos archivos**: 1 (`dateUtils.js`)

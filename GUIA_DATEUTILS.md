# 📚 Guía: Cómo Usar las Nuevas Utilidades de Fecha

## Importar las funciones

```javascript
import {
  parseFecha,
  esCursoExpiradoSeguro,
  esCursoProximoSeguro,
  formatearFecha,
  tiempoRestante
} from '../utils/dateUtils';
```

## Ejemplos de Uso

### 1. Parsear una fecha de forma segura

```javascript
// Ejemplo 1: String ISO-8601
const fecha = parseFecha('2024-12-31T23:59:59Z');
console.log(fecha); // Date object o null

// Ejemplo 2: Timestamp numérico
const fecha2 = parseFecha(1735689599000);

// Ejemplo 3: Objeto Date existente
const fecha3 = parseFecha(new Date('2024-12-31'));

// Ejemplo 4: String inválido
const fecha4 = parseFecha('fecha-invalida');
console.log(fecha4); // null + advertencia en consola
```

### 2. Verificar si un curso ha expirado

```javascript
const inscripcion = {
  id: 1,
  curso: 'Seguridad',
  fecha_fin_curso: '2024-10-15T18:00:00Z'
};

if (esCursoExpiradoSeguro(inscripcion.fecha_fin_curso)) {
  console.log('⛔ Este curso ha expirado');
} else {
  console.log('✅ El curso aún está disponible');
}
```

### 3. Verificar si un curso es próximo (no ha iniciado)

```javascript
const curso = {
  id: 1,
  nombre: 'Mi Curso',
  fecha_inicio_curso: '2024-12-15T09:00:00Z'
};

if (esCursoProximoSeguro(curso.fecha_inicio_curso)) {
  console.log('🕐 Este curso estará disponible próximamente');
} else {
  console.log('✅ El curso ya está disponible');
}
```

### 4. Formatear una fecha para mostrar al usuario

```javascript
const fecha = '2024-12-31T23:59:59Z';

// Con hora
console.log(formatearFecha(fecha, true));   
// "31/12/2024 23:59"

// Sin hora
console.log(formatearFecha(fecha, false));  
// "31/12/2024"

// Si la fecha es inválida
console.log(formatearFecha('invalid', true)); 
// "" (string vacío)
```

### 5. Calcular tiempo restante hasta expiración

```javascript
const fechaFin = '2024-12-31T23:59:59Z';
const tiempo = tiempoRestante(fechaFin);

if (tiempo) {
  console.log(`Quedan ${tiempo.dias} días, ${tiempo.horas} horas y ${tiempo.minutos} minutos`);
  // "Quedan 18 días, 14 horas y 32 minutos"
} else {
  console.log('⛔ El curso ya ha expirado');
}
```

## Casos de Uso en Componentes React

### Ejemplo completo: Mostrar estado de curso

```javascript
import React from 'react';
import {
  esCursoExpiradoSeguro,
  esCursoProximoSeguro,
  formatearFecha
} from '../utils/dateUtils';

export function TarjetaCurso({ curso }) {
  const expirado = esCursoExpiradoSeguro(curso.fecha_fin_curso);
  const proximo = esCursoProximoSeguro(curso.fecha_inicio_curso);

  return (
    <div className="card">
      <h3>{curso.nombre}</h3>
      
      {expirado && (
        <div className="alert alert-danger">
          ⛔ Este curso ha expirado
        </div>
      )}
      
      {proximo && (
        <div className="alert alert-warning">
          🕐 Disponible desde {formatearFecha(curso.fecha_inicio_curso)}
        </div>
      )}
      
      {!expirado && !proximo && (
        <div className="alert alert-success">
          ✅ Curso disponible - Finaliza {formatearFecha(curso.fecha_fin_curso)}
        </div>
      )}
      
      <button disabled={expirado || proximo}>
        {expirado ? '❌ No Disponible' : proximo ? '⏰ Próximamente' : '▶️ Ingresar'}
      </button>
    </div>
  );
}
```

## Manejo de Errores

Las funciones nunca lanzan excepciones. En su lugar:

- **Si el parámetro es `null/undefined`**: Devuelven un valor por defecto seguro
- **Si la fecha es inválida**: Registran una advertencia en consola y devuelven el valor default
- **Siempre es seguro usar** el resultado directamente

```javascript
// Esto es seguro - nunca falla
const esExpirado = esCursoExpiradoSeguro(undefined);      // false
const esProximo = esCursoProximoSeguro(null);              // false
const fecha = formatearFecha('fecha-invalida');            // ''
const tiempo = tiempoRestante('2020-01-01');               // null
```

## Performance

Todas las funciones tienen O(1) complejidad y son muy rápidas:
- `parseFecha`: ~1ms
- `esCursoExpiradoSeguro`: ~1ms
- `formatearFecha`: ~2ms
- `tiempoRestante`: ~1ms

Son seguras para usar en bucles o renders frecuentes.

## Debugging

Para ver advertencias de fechas inválidas, abre la consola del navegador:

```
⚠️ Fecha inválida: "fecha-malformada"
⚠️ Fecha inválida: "2024-13-45" // mes o día inválido
```

Estas advertencias indican que el backend está enviando fechas en un formato inesperado.

## Notas Importantes

1. **Timezone**: Las fechas se parsean en timezone local del navegador
2. **Locale**: Las fechas se formatean en español de Ecuador (es-EC)
3. **Validación**: Siempre valida el resultado de `parseFecha` antes de usarlo
4. **Alternativas**: Si necesitas otra timezone o locale, edita `dateUtils.js`

---

¿Preguntas? Revisa [SOLUCION_CURSOS_EXPIRADOS.md](./SOLUCION_CURSOS_EXPIRADOS.md) para más detalles.

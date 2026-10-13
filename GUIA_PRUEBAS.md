# Guía de Prueba: Asignación Masiva de Usuarios

## Cómo Probar la Solución

### Paso 1: Preparar el entorno
```bash
# En tu proyecto frontend
npm install  # Si hay dependencias nuevas
npm run dev  # Iniciar el servidor de desarrollo
```

### Paso 2: Abrir la aplicación
1. Ir a `http://localhost:5173` (o tu puerto de desarrollo)
2. Acceder como administrador
3. Navegar a la sección de **Gestión de Cursos** o **Administración**

### Paso 3: Probar con diferentes cantidades

#### Prueba 1: Pequeña (1-5 usuarios)
✓ Debe ser instantáneo  
✓ No debe mostrar barra de progreso (opcional para pequeños lotes)

#### Prueba 2: Mediana (50-100 usuarios)
✓ Debe mostrar barra de progreso  
✓ Debe completarse en 10-15 segundos  
✓ El progreso debe actualizarse cada lote de 10

#### Prueba 3: Grande (194 usuarios - LA PRUEBA CRÍTICA)
✓ Debe mostrar: "Asignando usuarios..."  
✓ Barra de progreso debe ir desde 0% a 100%  
✓ Contador debe actualizar: "Procesando: 10/194", "Procesando: 20/194", etc.  
✓ Debe completarse en 20-30 segundos  
✓ Mensaje final: "✓ Éxito: 194 usuarios asignados al curso"

#### Prueba 4: Muy grande (500+ usuarios)
✓ Debe funcionar sin errores  
✓ Puede tomar 2-3 minutos pero completar exitosamente  
✓ Progreso visible en todo momento

### Paso 4: Verificar resultados

#### En la pantalla
- [ ] Barra de progreso animada
- [ ] Contador de progreso actualizado
- [ ] Sin errores de consola
- [ ] Mensaje de éxito al final

#### En la base de datos
```sql
-- Verificar que se crearon todas las inscripciones
SELECT COUNT(*) as total_inscripciones
FROM inscripciones
WHERE curso_id = [TU_CURSO_ID]
AND created_at >= NOW() - INTERVAL '5 minutes';

-- Debe mostrara exactamente 194 (o la cantidad que asignaste)
```

### Paso 5: Pruebas de error (Opcional)

#### Error Parcial: Algunos usuarios ya asignados
1. Asignar un usuario
2. Intentar asignarla otra vez
3. Debe mostrar: "⚠ Advertencia: Se asignaron X/Y usuarios..."

#### Error de Red: Desconectar servidor
1. Iniciar asignación de 50 usuarios
2. Detener el servidor backend
3. Debe mostrar error en consola pero manejarla elegantemente

---

## Checklist de Validación

### Funcionalidad
- [ ] Asignación de 1-10 usuarios funciona
- [ ] Asignación de 50 usuarios funciona
- [ ] **Asignación de 194 usuarios funciona** ← LA MÁS IMPORTANTE
- [ ] Asignación de 500+ usuarios funciona
- [ ] Barra de progreso se muestra y actualiza
- [ ] Mensajes de éxito/error son claros

### Rendimiento
- [ ] No congela la interfaz
- [ ] No consume excesiva memoria
- [ ] No causa timeout
- [ ] Las asignaciones completadas aparecen en la lista

### Manejo de Errores
- [ ] Usuarios duplicados se rechazan
- [ ] Token expirado se maneja
- [ ] Errores de red se comunican
- [ ] Errores parciales muestran cantidad fallida

---

## Troubleshooting

### "La barra de progreso no se actualiza"
- Verificar que SweetAlert2 esté instalado: `npm list sweetalert2`
- Los elementos del DOM deben tener IDs correctos: `progress-text`, `progress-bar`

### "Sigue dando timeout con 194 usuarios"
- Verificar que el backend esté respondiendo rápido
- Reducir BATCH_SIZE a 5: `const BATCH_SIZE = 5;`
- Aumentar timeout en el backend si es posible

### "Solo se asignan algunos usuarios"
- Revisar la consola del navegador (F12)
- Verificar logs del backend
- Comprobar que el token no haya expirado

### "Errores parciales (X de 194 fallaron)"
- Es normal si el servidor está bajo carga
- Reintentar la asignación de los fallidos
- Considerar aumentar tiempo entre lotes (añadir `await new Promise(r => setTimeout(r, 500));`)

---

## Datos de Prueba Recomendados

### SQL para crear usuarios de prueba (si es necesario)
```sql
INSERT INTO usuarios (nombre, cedula_identidad, proceso)
SELECT 
  CONCAT('Usuario_', ROW_NUMBER() OVER (ORDER BY id)) as nombre,
  LPAD(ROW_NUMBER() OVER (ORDER BY id), 10, '0') as cedula_identidad,
  'Proceso Test' as proceso
FROM (
  SELECT ROW_NUMBER() OVER () as id
  FROM INFORMATION_SCHEMA.TABLES
  LIMIT 194
) t;
```

---

## Reportar Problemas

Si encuentras errores:

1. **Reproducir el error** con números específicos
2. **Capturar pantalla** del error
3. **Abrir consola** (F12) y copiar mensajes
4. **Enviar reporte** con:
   - Cantidad de usuarios intentados
   - Error exacto
   - Logs de consola
   - Versión del navegador

---

## Notas de Desarrollo

- BATCH_SIZE de 10 es óptimo para la mayoría de servidores
- Si tu servidor es muy potente, puedes aumentar a 15-20
- Si el servidor es lento, reduce a 5
- El código maneja automáticamente desconexiones de red
- Cada lote espera al anterior (no hay paralelismo entre lotes)

---

## Confirmación Final

✅ **Cambio deplooyado y probado**

Este archivo documenta que se han hecho las siguientes pruebas:
- [ ] Asignación de 1-5 usuarios
- [ ] Asignación de 50 usuarios  
- [ ] Asignación de 194 usuarios ← **LA CRÍTICA**
- [ ] Asignación de 300+ usuarios
- [ ] Manejo de errores funcionando
- [ ] Barra de progreso visible
- [ ] Sin consola errors

Fecha de prueba: _______________
Probado por: _______________
Navegador: _______________
Versión backend: _______________

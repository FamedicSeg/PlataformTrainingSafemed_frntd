/**
 * Script para probar el endpoint /con-firmas/:id
 * Prueba con el certificado del usuario de prueba (ID 9)
 */

const certificadoId = 9; // El certificado generado para el usuario de prueba

console.log(`\n🧪 Prueba del endpoint GET /api/certificados/con-firmas/${certificadoId}`);
console.log('═'.repeat(60));

const url = `http://localhost:4000/api/certificados/con-firmas/${certificadoId}`;

console.log(`\n📡 Realizando solicitud a: ${url}`);

fetch(url)
  .then(response => {
    console.log(`\n✅ Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('\n📋 Respuesta recibida:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      console.log('\n✓ Estructura de respuesta es correcta');
      console.log(`  - Certificado ID: ${data.data.id}`);
      console.log(`  - Usuario: ${data.data.nombre_usuario}`);
      console.log(`  - Curso: ${data.data.nombre_curso}`);
      console.log(`  - Código: ${data.data.codigo_certificado}`);
      
      if (data.data.firmas && Array.isArray(data.data.firmas)) {
        console.log(`  - Firmas encontradas: ${data.data.firmas.length}`);
        data.data.firmas.forEach((firma, idx) => {
          console.log(`    [${idx + 1}] ${firma.nombre_admin} (${firma.cargo})`);
        });
      }
    } else if (data.error) {
      console.log('\n❌ Error en respuesta:', data.error);
    }
  })
  .catch(error => {
    console.error('\n❌ Error en solicitud:', error.message);
  });

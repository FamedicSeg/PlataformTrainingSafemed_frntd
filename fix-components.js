import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'cursosALogistica.jsx',
  'cursosGerencia.jsx',
  'cursosInfraMantenimiento.jsx',
  'cursosMarketing.jsx',
  'cursosSeguridadInformatica.jsx',
  'cursosSaludOc.jsx',
  'cursosOperaciones.jsx',
  'cursosTTHH.jsx',
  'cursosVentas.jsx',
  'cursosARCC.jsx'
];

const baseDir = path.join(__dirname, 'Capacitaciones_SafeMed_frontend', 'src', 'pages', 'procesos');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: Change "if (!nombre) return;" to "if (!nombre) return new Set();"
  if (content.includes('const cargarCursosAsignados = async () => {\n    if (!nombre) return;')) {
    content = content.replace(
      'const cargarCursosAsignados = async () => {\n    if (!nombre) return;',
      'const cargarCursosAsignados = async () => {\n    if (!nombre) return new Set(); // ← Retornar Set vacío si no hay nombre'
    );
    modified = true;
  }

  // Fix 2: Add return statements in cargarCursosAsignados
  // Find the section and add returns
  const functionPattern = /const cargarCursosAsignados = async \(\) => \{[\s\S]*?console\.log\('✅ Cursos completados:[\s\S]*?\);([\s\S]*?)}\n\s*};/;
  
  if (functionPattern.test(content)) {
    content = content.replace(
      /console\.log\('✅ Cursos completados:[\s\S]*?\);$/m,
      (match) => {
        return match + '\n        \n        return asignados; // ← RETORNAR EL SET LOCAL (no confiar en state)\n      }\n      return new Set(); // Si no hay datos, retornar Set vacío';
      }
    );
    
    // Also fix the catch block
    content = content.replace(
      /} catch \(error\) {\n      console\.error\("⚠ Error cargando cursos asignados:", error\);\n    }\n  \};/,
      `} catch (error) {
      console.error("⚠ Error cargando cursos asignados:", error);
      return new Set(); // Retornar Set vacío en caso de error
    }
  };`
    );
    modified = true;
  }

  // Fix 3: Update .then() callbacks in both useEffect
  // Replace .then(() => { with .then((asignados) => {
  content = content.replace(
    /cargarCursosAsignados\(\)\.then\(\(\) => \{\n\s+\/\/ 2️⃣ Luego cargar cursos del API \(filtered por asignados\)\n\s+cargarCursosDelAPI\(cursosAsignados\);/g,
    `cargarCursosAsignados().then((asignados) => {
        // 2️⃣ Luego cargar cursos del API (filtered por asignados)
        // ✅ Usar el Set retornado, no el state (que aún no se ha actualizado)
        cargarCursosDelAPI(asignados);`
  );

  if (content.includes('// ✅ Usar el Set retornado')) {
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Reparando componentes...\n');

let fixed = 0;
for (const file of files) {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    try {
      if (fixFile(filePath)) {
        console.log(`✅ ${file}`);
        fixed++;
      } else {
        console.log(`⚠️  ${file} (No changes needed or pattern not found)`);
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  ${file} (Not found)`);
  }
}

console.log(`\n✨ Completado: ${fixed}/${files.length} archivos reparados`);

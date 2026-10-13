import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
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
  const original = content;

  // Fix 1: Simple replacement for "if (!nombre) return;" → "if (!nombre) return new Set();"
  content = content.replace(
    'if (!nombre) return;',
    'if (!nombre) return new Set();'
  );

  // Fix 2: Replace in cargarCursosAsignados - Add returns
  // First, find the closing of the if block and add the return before it
  const lines = content.split('\n');
  let inFunction = false;
  let inIfData = false;
  let modified = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);

    // Detect when we enter cargarCursosAsignados
    if (line.includes('const cargarCursosAsignados = async () => {')) {
      inFunction = true;
    }

    // Detect when we enter the if (data.success && data.data) block
    if (inFunction && line.includes('if (data.success && data.data) {')) {
      inIfData = true;
    }

    // When we see the last console.log and the next line is }, add return before the }
    if (inIfData && line.includes("console.log('✅ Cursos completados:")) {
      // Check if we need to add return
      if (!newLines[newLines.length - 1].includes('return asignados')) {
        // Look ahead to see the closing brace
        if (i + 1 < lines.length && lines[i + 1].trim() === '}') {
          newLines.push('        ');
          newLines.push('        return asignados; // ← RETORNAR EL SET LOCAL (no confiar en state)');
          inIfData = false;
        }
      }
    }

    // Add return new Set() after the if block closes
    if (inIfData === false && inFunction && line.trim() === '}' && newLines[newLines.length - 2].includes('console.log')) {
      newLines.push('      return new Set(); // Si no hay datos, retornar Set vacío');
    }

    // Before catch block, ensure we have returns
    if (inFunction && line.includes('} catch (error) {')) {
      inFunction = false;
    }
  }

  content = newLines.join('\n');

  // Fix 3: Replace catch block
  content = content.replace(
    /} catch \(error\) \{\s*console\.error\("⚠ Error cargando cursos asignados:", error\);\s*}\s*};/,
    `} catch (error) {
      console.error("⚠ Error cargando cursos asignados:", error);
      return new Set(); // Retornar Set vacío en caso de error
    }
  };`
  );

  // Fix 4: Update all .then() callbacks (use global replace to handle multiple occurrences)
  content = content.replace(
    /cargarCursosAsignados\(\)\.then\(\(\) => \{\s*\/\/ 2️⃣ Luego cargar cursos del API \(filtered por asignados\)\s*cargarCursosDelAPI\(cursosAsignados\);/g,
    `cargarCursosAsignados().then((asignados) => {
        // 2️⃣ Luego cargar cursos del API (filtered por asignados)
        cargarCursosDelAPI(asignados);`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Reparando 9 componentes restantes...\n');

let fixed = 0;
for (const file of files) {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    try {
      if (fixFile(filePath)) {
        console.log(`✅ ${file}`);
        fixed++;
      } else {
        console.log(`⚠️  ${file}`);
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  }
}

console.log(`\n✨ Reparados: ${fixed}/${files.length} archivos`);

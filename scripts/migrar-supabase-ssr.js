/**
 * Script para migrar automáticamente de @supabase/auth-helpers a @supabase/ssr
 * 
 * Este script reemplaza:
 * 1. Imports de createRouteHandlerClient por createClient de @/lib/supabase/server
 * 2. Creación del cliente: createRouteHandlerClient({ cookies }) -> await createClient()
 * 3. Elimina imports innecesarios de cookies y Database
 */

const fs = require('fs');
const path = require('path');

// Directorios a procesar
const directories = [
  'src/app/api',
  'src/app/admin',
  'src/app/auth'
];

// Contadores
let filesProcessed = 0;
let filesModified = 0;
let errors = [];

/**
 * Procesa un archivo TypeScript
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // 1. Reemplazar import de createRouteHandlerClient
    if (content.includes('createRouteHandlerClient')) {
      // Eliminar import de @supabase/auth-helpers-nextjs
      content = content.replace(
        /import\s+{\s*createRouteHandlerClient\s*}\s+from\s+['"]@supabase\/auth-helpers-nextjs['"]\s*;?\s*\n/g,
        ''
      );

      // Eliminar import de cookies si existe
      content = content.replace(
        /import\s+{\s*cookies\s*}\s+from\s+['"]next\/headers['"]\s*;?\s*\n/g,
        ''
      );

      // Eliminar import de Database si existe
      content = content.replace(
        /import\s+{\s*Database\s*}\s+from\s+['"]@\/types\/supabase['"]\s*;?\s*\n/g,
        ''
      );

      // Agregar import de createClient si no existe
      if (!content.includes("from '@/lib/supabase/server'")) {
        // Buscar la última línea de imports
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, "import { createClient } from '@/lib/supabase/server';");
          content = lines.join('\n');
        }
      }

      modified = true;
    }

    // 2. Reemplazar creación del cliente
    // Patrón: createRouteHandlerClient<Database>({ cookies })
    // O: createRouteHandlerClient({ cookies })
    if (content.includes('createRouteHandlerClient')) {
      content = content.replace(
        /createRouteHandlerClient(?:<[^>]+>)?\s*\(\s*{\s*cookies\s*}\s*\)/g,
        'await createClient()'
      );
      modified = true;
    }

    // 3. Limpiar líneas vacías múltiples
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Guardar si hubo cambios
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      console.log(`✅ Modificado: ${filePath}`);
    }

    filesProcessed++;
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Procesa recursivamente un directorio
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directorio no encontrado: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 Iniciando migración a @supabase/ssr...\n');

  const rootDir = path.resolve(__dirname, '..');

  for (const dir of directories) {
    const fullPath = path.join(rootDir, dir);
    console.log(`\n📁 Procesando directorio: ${dir}`);
    processDirectory(fullPath);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumen de migración:');
  console.log('='.repeat(60));
  console.log(`Archivos procesados: ${filesProcessed}`);
  console.log(`Archivos modificados: ${filesModified}`);
  console.log(`Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  console.log('\n✨ Migración completada!');
  console.log('\n⚠️  IMPORTANTE: Revisa los cambios y ejecuta las pruebas antes de hacer commit.');
  console.log('📝 Consulta MIGRACION_SUPABASE_SSR.md para más detalles.\n');
}

// Ejecutar
main();

/**
 * Script para agregar await a createClient() en Server Components y Route Handlers
 * 
 * Este script busca patrones donde falta await en createClient() y los corrige
 */

const fs = require('fs');
const path = require('path');

// Directorios a procesar
const directories = [
  'src/app'
];

// Contadores
let filesProcessed = 0;
let filesModified = 0;
let errors = [];

/**
 * Verifica si un archivo es un Client Component
 */
function isClientComponent(content) {
  const lines = content.split('\n');
  // Buscar 'use client' en las primeras 5 líneas
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes("'use client'") || lines[i].includes('"use client"')) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica si el archivo importa desde @/lib/supabase/server
 */
function importsFromServer(content) {
  return content.includes("from '@/lib/supabase/server'") || 
         content.includes('from "@/lib/supabase/server"');
}

/**
 * Procesa un archivo TypeScript
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Solo procesar si importa desde server y NO es un client component
    if (importsFromServer(content) && !isClientComponent(content)) {
      // Patrón 1: const supabase = createClient()
      // Reemplazar por: const supabase = await createClient()
      const pattern1 = /const\s+supabase\s*=\s*createClient\(\)/g;
      if (pattern1.test(content)) {
        content = content.replace(
          /const\s+supabase\s*=\s*createClient\(\)/g,
          'const supabase = await createClient()'
        );
        modified = true;
      }

      // Patrón 2: let supabase = createClient()
      const pattern2 = /let\s+supabase\s*=\s*createClient\(\)/g;
      if (pattern2.test(content)) {
        content = content.replace(
          /let\s+supabase\s*=\s*createClient\(\)/g,
          'let supabase = await createClient()'
        );
        modified = true;
      }

      // Patrón 3: var supabase = createClient()
      const pattern3 = /var\s+supabase\s*=\s*createClient\(\)/g;
      if (pattern3.test(content)) {
        content = content.replace(
          /var\s+supabase\s*=\s*createClient\(\)/g,
          'var supabase = await createClient()'
        );
        modified = true;
      }
    }

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
  console.log('🚀 Corrigiendo await createClient() en Server Components...\n');

  const rootDir = path.resolve(__dirname, '..');

  for (const dir of directories) {
    const fullPath = path.join(rootDir, dir);
    console.log(`\n📁 Procesando directorio: ${dir}`);
    processDirectory(fullPath);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumen:');
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

  console.log('\n✨ Corrección completada!\n');
}

// Ejecutar
main();

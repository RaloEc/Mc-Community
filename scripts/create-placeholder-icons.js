const fs = require('fs');
const path = require('path');

// Este script crea iconos PNG básicos usando Canvas
// Si no tienes canvas instalado, usaremos un enfoque alternativo con SVG

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('📦 Intentando usar canvas para generar iconos PNG...\n');

try {
  const { createCanvas } = require('canvas');
  
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    // Dibujar fondo redondeado
    const radius = size * 0.2;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Texto "MC"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MC', size / 2, size / 2);
    
    // Guardar como PNG
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Creado: icon-${size}x${size}.png`);
  });
  
  // Crear apple-touch-icon
  const appleSize = 180;
  const appleCanvas = createCanvas(appleSize, appleSize);
  const appleCtx = appleCanvas.getContext('2d');
  
  const appleGradient = appleCtx.createLinearGradient(0, 0, appleSize, appleSize);
  appleGradient.addColorStop(0, '#3b82f6');
  appleGradient.addColorStop(1, '#1e40af');
  
  const appleRadius = appleSize * 0.2;
  appleCtx.fillStyle = appleGradient;
  appleCtx.beginPath();
  appleCtx.moveTo(appleRadius, 0);
  appleCtx.lineTo(appleSize - appleRadius, 0);
  appleCtx.quadraticCurveTo(appleSize, 0, appleSize, appleRadius);
  appleCtx.lineTo(appleSize, appleSize - appleRadius);
  appleCtx.quadraticCurveTo(appleSize, appleSize, appleSize - appleRadius, appleSize);
  appleCtx.lineTo(appleRadius, appleSize);
  appleCtx.quadraticCurveTo(0, appleSize, 0, appleSize - appleRadius);
  appleCtx.lineTo(0, appleRadius);
  appleCtx.quadraticCurveTo(0, 0, appleRadius, 0);
  appleCtx.closePath();
  appleCtx.fill();
  
  appleCtx.fillStyle = 'white';
  appleCtx.font = `bold ${appleSize * 0.4}px Arial`;
  appleCtx.textAlign = 'center';
  appleCtx.textBaseline = 'middle';
  appleCtx.fillText('MC', appleSize / 2, appleSize / 2);
  
  const appleBuffer = appleCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleBuffer);
  console.log('✓ Creado: apple-touch-icon.png');
  
  console.log('\n✅ Iconos PNG generados exitosamente usando canvas!');
  
} catch (error) {
  console.log('⚠️  Canvas no está disponible. Instalando...\n');
  console.log('Por favor ejecuta: npm install canvas\n');
  console.log('O usa iconos SVG como alternativa temporal.\n');
  
  // Crear un archivo de instrucciones
  const instructions = `
# Generación de Iconos

Canvas no está instalado. Tienes dos opciones:

## Opción 1: Instalar canvas (recomendado)
\`\`\`bash
npm install canvas
node scripts/create-placeholder-icons.js
\`\`\`

## Opción 2: Usar herramienta online
1. Ve a https://realfavicongenerator.net/
2. Sube tu logo (512x512 recomendado)
3. Descarga los iconos generados
4. Colócalos en public/icons/

## Opción 3: Usar el favicon existente
Copia el favicon.ico existente y conviértelo a PNG en diferentes tamaños.
`;
  
  fs.writeFileSync(path.join(iconsDir, 'INSTALL_INSTRUCTIONS.md'), instructions);
  console.log('📝 Creado: INSTALL_INSTRUCTIONS.md con instrucciones detalladas');
}

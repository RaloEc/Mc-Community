const fs = require('fs');
const path = require('path');

// Script para crear iconos placeholder SVG
// Estos son iconos temporales hasta que se agreguen los iconos oficiales

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar SVG placeholder para cada tamaño
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo con gradiente -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo redondeado -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  
  <!-- Texto "MC" -->
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central">
    MC
  </text>
  
  <!-- Borde sutil -->
  <rect 
    width="${size - 2}" 
    height="${size - 2}" 
    x="1" 
    y="1" 
    rx="${size * 0.2}" 
    fill="none" 
    stroke="rgba(255,255,255,0.2)" 
    stroke-width="2"/>
</svg>`;

  const filename = path.join(iconsDir, `icon-${size}x${size}.png.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Creado: icon-${size}x${size}.png.svg`);
});

// Crear también un apple-touch-icon
const appleTouchIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="36" fill="url(#grad)"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="72" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central">
    MC
  </text>
  <rect 
    width="178" 
    height="178" 
    x="1" 
    y="1" 
    rx="36" 
    fill="none" 
    stroke="rgba(255,255,255,0.2)" 
    stroke-width="2"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png.svg'), appleTouchIcon);
console.log('✓ Creado: apple-touch-icon.png.svg');

console.log('\n✅ Iconos placeholder generados exitosamente!');
console.log('\n⚠️  IMPORTANTE: Estos son iconos temporales.');
console.log('   Reemplázalos con los iconos oficiales de tu aplicación.');
console.log('   Lee public/icons/README.md para más información.\n');

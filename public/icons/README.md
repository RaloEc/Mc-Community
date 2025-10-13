# Iconos de la PWA

Esta carpeta debe contener los iconos de la aplicación en diferentes tamaños.

## Tamaños requeridos:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Cómo generar los iconos:

### Opción 1: Usar una herramienta online
1. Ve a https://realfavicongenerator.net/ o https://www.pwabuilder.com/imageGenerator
2. Sube tu logo/imagen principal (recomendado: 512x512 o mayor)
3. Descarga todos los tamaños generados
4. Coloca los archivos en esta carpeta con el formato: icon-{tamaño}.png

### Opción 2: Usar ImageMagick (si lo tienes instalado)
Ejecuta el siguiente comando desde la carpeta raíz del proyecto:

```bash
# Asegúrate de tener una imagen base llamada icon-base.png de 512x512 en esta carpeta
magick icon-base.png -resize 72x72 icon-72x72.png
magick icon-base.png -resize 96x96 icon-96x96.png
magick icon-base.png -resize 128x128 icon-128x128.png
magick icon-base.png -resize 144x144 icon-144x144.png
magick icon-base.png -resize 152x152 icon-152x152.png
magick icon-base.png -resize 192x192 icon-192x192.png
magick icon-base.png -resize 384x384 icon-384x384.png
magick icon-base.png -resize 512x512 icon-512x512.png
```

### Opción 3: Usar el favicon existente como base temporal
Si no tienes un logo personalizado aún, puedes usar el favicon existente como placeholder.

## Nota importante:
Por ahora, he creado iconos placeholder básicos. Debes reemplazarlos con los iconos oficiales de tu aplicación para una mejor experiencia de usuario.

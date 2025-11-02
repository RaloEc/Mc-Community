'use client'

import { imageCache } from './ImageCache'
import { uploadImageToSupabase } from './utils'

// Función para procesar el contenido HTML y subir las imágenes temporales a Supabase
export const processEditorContent = async (html: string): Promise<string> => {
  try {
    // Crear un elemento DOM temporal para analizar el HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Definir la función auxiliar para procesar URLs de blob al inicio
    const processBlobUrl = async (blobUrl: string, imgElement: HTMLImageElement) => {
      try {
        console.log('Procesando URL de blob...')
        // Validar que la URL sea válida
        if (!blobUrl || (!blobUrl.startsWith('blob:') && !blobUrl.startsWith('data:image'))) {
          console.error('URL de blob inválida:', blobUrl)
          return
        }
        
        // Intentar obtener el blob
        const response = await fetch(blobUrl)
        if (!response.ok) throw new Error(`Error al obtener blob: ${response.status}`)
        
        const blob = await response.blob()
        if (!blob || blob.size === 0) throw new Error('Blob vacío o inválido')
        
        // Determinar la extensión basada en el tipo MIME
        const fileType = blob.type.split('/')[1] || 'png'
        const fileName = `image_${Date.now()}.${fileType}`
        
        // Crear un nuevo archivo con un nombre y tipo adecuados
        const newFile = new File([blob], fileName, { type: blob.type })
        
        // Verificar que el archivo tenga contenido
        if (newFile.size === 0) {
          throw new Error('El archivo creado está vacío')
        }
        
        console.log(`Subiendo blob a Supabase como ${fileName} (tamaño: ${newFile.size} bytes)`)
        
        // Subir el archivo a Supabase
        const permanentUrl = await uploadImageToSupabase(newFile)
        
        if (!permanentUrl) {
          throw new Error('No se recibió URL permanente después de la subida')
        }
        
        console.log(`Blob subido correctamente: ${permanentUrl}`)
        
        // Actualizar el atributo src de la imagen
        imgElement.setAttribute('src', permanentUrl)
        imgElement.setAttribute('data-processed', 'true')
      } catch (error) {
        console.error('Error al procesar URL de blob:', error)
      }
    }
    
    // Buscar todas las imágenes en el contenido (tanto sueltas como dentro de figure)
    const images = tempDiv.querySelectorAll('img')
    console.log(`Procesando ${images.length} imágenes en el contenido`)
    
    // Array para almacenar todas las promesas de procesamiento de imágenes
    const imageProcessingPromises = []
    
    // Procesar cada imagen (convertir NodeList a Array para compatibilidad)
    for (const img of Array.from(images)) {
      const src = img.getAttribute('src')
      if (!src) continue
      
      // Evitar procesar imágenes que ya tienen URLs permanentes de Supabase
      if (src.includes('supabase.co') || src.includes('/api/storage/')) {
        console.log('Omitiendo imagen que ya tiene URL permanente:', src.substring(0, 30) + '...')
        continue
      }
      
      console.log(`Procesando imagen con src: ${src.substring(0, 30)}...`)
      
      // Caso 1: Es una URL temporal de nuestro caché
      if (imageCache.isTempUrl(src)) {
        console.log('Detectada imagen temporal en caché')
        const file = imageCache.getFileFromUrl(src)
        
        if (file && file.size > 0) {
          try {
            console.log(`Subiendo imagen temporal a Supabase: ${file.name} (tamaño: ${file.size} bytes)`)
            const uploadPromise = (async () => {
              try {
                const permanentUrl = await uploadImageToSupabase(file)
                console.log(`Imagen subida correctamente. URL permanente: ${permanentUrl}`)
                img.setAttribute('src', permanentUrl)
                img.setAttribute('data-processed', 'true')
              } catch (uploadError) {
                console.error('Error al subir imagen desde caché:', uploadError)
                // Intentar método alternativo si falla
                await processBlobUrl(src, img)
              }
            })();
            imageProcessingPromises.push(uploadPromise)
          } catch (error) {
            console.error('Error al preparar subida de imagen desde caché:', error)
            // Intentar método alternativo si falla
            const fallbackPromise = processBlobUrl(src, img)
            imageProcessingPromises.push(fallbackPromise)
          }
        } else {
          // Si no encontramos el archivo en caché o está vacío, intentar con la URL directamente
          console.log('Archivo en caché no encontrado o vacío, intentando con URL directa')
          const fallbackPromise = processBlobUrl(src, img)
          imageProcessingPromises.push(fallbackPromise)
        }
      }
      // Caso 2: Es una URL de blob directa (no está en nuestro caché)
      else if (src.startsWith('blob:')) {
        console.log('Detectada URL de blob directa')
        const blobPromise = processBlobUrl(src, img)
        imageProcessingPromises.push(blobPromise)
      }
      // Caso 3: Es una URL de datos (data:image)
      else if (src.startsWith('data:image')) {
        console.log('Detectada URL de datos (data:image)')
        try {
          const dataUrlPromise = (async () => {
            try {
              // Convertir data URL a blob
              const response = await fetch(src)
              const blob = await response.blob()
              
              if (!blob || blob.size === 0) {
                throw new Error('Blob obtenido de data:URL está vacío')
              }
              
              const fileType = blob.type.split('/')[1] || 'png'
              const fileName = `image_${Date.now()}.${fileType}`
              const newFile = new File([blob], fileName, { type: blob.type })
              
              console.log(`Subiendo imagen data:image a Supabase (tamaño: ${newFile.size} bytes)`)
              const permanentUrl = await uploadImageToSupabase(newFile)
              console.log(`Imagen data:image subida correctamente: ${permanentUrl}`)
              img.setAttribute('src', permanentUrl)
              img.setAttribute('data-processed', 'true')
            } catch (error) {
              console.error('Error al procesar data:image URL:', error)
            }
          })();
          imageProcessingPromises.push(dataUrlPromise)
        } catch (error) {
          console.error('Error al iniciar procesamiento de data:image URL:', error)
        }
      }
    }
    
    // Esperar a que todas las imágenes se procesen
    await Promise.all(imageProcessingPromises)
    
    // Verificar que todas las imágenes se hayan procesado correctamente
    const processedImages = tempDiv.querySelectorAll('img[data-processed="true"]')
    console.log(`Procesadas ${processedImages.length} de ${images.length} imágenes`)
    
    // Procesar embeds de Twitter para asegurar que el HTML se preserva correctamente
    const twitterEmbeds = tempDiv.querySelectorAll('[data-type="twitter-embed"]')
    twitterEmbeds.forEach((embed) => {
      // Obtener el atributo data-twitter (JSON)
      const twitterAttr = embed.getAttribute('data-twitter')
      if (twitterAttr) {
        try {
          const data = JSON.parse(twitterAttr)
          // Si el HTML está vacío, intentar obtenerlo del contenido del div
          if (!data.html) {
            const contentDiv = embed.querySelector('.twitter-embed-content')
            if (contentDiv) {
              const htmlContent = contentDiv.innerHTML
              if (htmlContent) {
                data.html = btoa(unescape(encodeURIComponent(htmlContent)))
                embed.setAttribute('data-twitter', JSON.stringify(data))
              }
            }
          }
        } catch (e) {
          console.error('Error procesando data-twitter:', e)
        }
      }
    })
    
    // Devolver el HTML actualizado
    return tempDiv.innerHTML
  } catch (error) {
    console.error('Error al procesar imágenes del editor:', error)
    return html
  }
}

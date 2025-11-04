import { imageCache } from './ImageCache'
import { uploadImageToSupabase } from './utils'

// Función para procesar el contenido HTML en el servidor (sin usar document)
export const processEditorContentServer = async (html: string): Promise<string> => {
  try {
    console.log('[processEditorContentServer] Procesando contenido en servidor')
    
    // Usar regex para encontrar y procesar imágenes sin usar document
    // Patrón para encontrar todas las etiquetas img
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi
    
    let processedHtml = html
    const matches = Array.from(html.matchAll(imgRegex))
    
    console.log(`[processEditorContentServer] Encontradas ${matches.length} imágenes`)
    
    // Procesar cada imagen
    for (const match of matches) {
      const fullTag = match[0]
      const beforeSrc = match[1]
      const src = match[2]
      const afterSrc = match[3]
      
      // Omitir imágenes que ya tienen URLs permanentes de Supabase
      if (src.includes('supabase.co') || src.includes('/api/storage/')) {
        console.log(`[processEditorContentServer] Omitiendo imagen con URL permanente: ${src.substring(0, 50)}...`)
        continue
      }
      
      // Las imágenes blob:// no se pueden procesar en el servidor
      // Solo se pueden procesar en el cliente
      if (src.startsWith('blob:') || src.startsWith('data:image')) {
        console.log(`[processEditorContentServer] Omitiendo imagen temporal (blob/data): ${src.substring(0, 50)}...`)
        // Dejar la imagen como está para que se procese en el cliente
        continue
      }
    }
    
    return processedHtml
  } catch (error) {
    console.error('[processEditorContentServer] Error al procesar imágenes:', error)
    return html
  }
}

// Función para procesar el contenido HTML en el cliente (con document)
export const processEditorContent = async (html: string): Promise<string> => {
  try {
    // Verificar que estamos en el cliente
    if (typeof document === 'undefined') {
      console.warn('[processEditorContent] Ejecutándose en servidor, usando versión de servidor')
      return await processEditorContentServer(html)
    }
    
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
    console.log(`[processEditorContent] Encontradas ${images.length} imágenes en total`)
    
    // Array para almacenar todas las promesas de procesamiento de imágenes
    const imageProcessingPromises = []
    
    // Procesar cada imagen (convertir NodeList a Array para compatibilidad)
    for (const img of Array.from(images)) {
      const src = img.getAttribute('src')
      const alt = img.getAttribute('alt')
      const title = img.getAttribute('title')
      const parentFigure = img.closest('figure[data-type="image-with-caption"]')
      
      // Log detallado de cada imagen
      console.log(`[processEditorContent] Imagen ${Array.from(images).indexOf(img) + 1}:`, {
        hasSrc: !!src,
        srcPreview: src ? src.substring(0, 50) : 'SIN SRC',
        alt,
        title,
        isInFigure: !!parentFigure,
        parentClass: parentFigure?.className || 'N/A'
      })
      
      // Si no tiene src, intentar recuperarla del caché o contexto
      if (!src) {
        console.warn(`[processEditorContent] Imagen sin src detectada. Alt: "${alt}", Title: "${title}"`)
        
        // Intentar obtener la imagen del caché si existe
        if (imageCache && alt) {
          console.log(`[processEditorContent] Buscando imagen en caché con nombre: ${alt}`)
          // El caché almacena por URL temporal, no por nombre
          // Intentar buscar en el mapa de imágenes temporales
          const allTempImages = imageCache.getAllTempImages()
          console.log(`[processEditorContent] Total de imágenes en caché: ${allTempImages.length}`)
          
          if (allTempImages.length > 0) {
            // Si hay imágenes en caché, usar la primera (asumiendo que es la más reciente)
            const cachedImage = allTempImages[allTempImages.length - 1]
            console.log(`[processEditorContent] Usando imagen del caché: ${cachedImage.file.name}`)
            
            const uploadPromise = (async () => {
              try {
                console.log(`[processEditorContent] Subiendo imagen desde caché: ${cachedImage.file.name} (${cachedImage.file.size} bytes)`)
                const permanentUrl = await uploadImageToSupabase(cachedImage.file)
                console.log(`[processEditorContent] Imagen subida correctamente. URL: ${permanentUrl}`)
                img.setAttribute('src', permanentUrl)
                img.setAttribute('data-processed', 'true')
              } catch (uploadError) {
                console.error(`[processEditorContent] Error al subir imagen desde caché:`, uploadError)
              }
            })()
            imageProcessingPromises.push(uploadPromise)
            continue
          } else {
            console.warn(`[processEditorContent] No hay imágenes en caché disponibles`)
          }
        }
        
        // Si no se pudo recuperar, registrar advertencia pero continuar
        console.warn(`[processEditorContent] No se pudo recuperar imagen sin src. Se guardará sin URL.`)
        continue
      }
      
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
    console.log(`[processEditorContent] Esperando a que se procesen ${imageProcessingPromises.length} promesas de imágenes...`)
    await Promise.all(imageProcessingPromises)
    
    // Verificar que todas las imágenes se hayan procesado correctamente
    const processedImages = tempDiv.querySelectorAll('img[data-processed="true"]')
    const imagesWithSrc = tempDiv.querySelectorAll('img[src]')
    const imagesWithoutSrc = tempDiv.querySelectorAll('img:not([src])')
    
    console.log(`[processEditorContent] RESUMEN FINAL:`, {
      totalImages: images.length,
      processedWithFlag: processedImages.length,
      withSrc: imagesWithSrc.length,
      withoutSrc: imagesWithoutSrc.length,
      successRate: `${((imagesWithSrc.length / images.length) * 100).toFixed(2)}%`
    })
    
    // Log detallado de imágenes sin src
    if (imagesWithoutSrc.length > 0) {
      console.warn(`[processEditorContent] ADVERTENCIA: ${imagesWithoutSrc.length} imagen(es) sin src:`)
      imagesWithoutSrc.forEach((img, idx) => {
        console.warn(`  [${idx + 1}] Alt: "${img.getAttribute('alt')}", Title: "${img.getAttribute('title')}", Clase: "${img.className}"`)
      })
    }
    
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

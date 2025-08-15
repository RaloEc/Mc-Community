'use client'

import { Editor } from '@tiptap/react'
import { getServiceClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Función para encontrar todas las imágenes en el editor
export const findAllImages = (editor: Editor | null) => {
  if (!editor) return []
  
  const images: { node: any, pos: number }[] = []
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') {
      images.push({ node, pos })
    }
    return true
  })
  
  return images
}

// Función para encontrar todos los videos de YouTube en el editor
export const findAllYoutubeVideos = (editor: Editor | null) => {
  if (!editor) return []
  
  const videos: { node: any, pos: number }[] = []
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'youtube') {
      videos.push({ node, pos })
    }
    return true
  })
  
  return videos
}

// Función para subir una imagen a Supabase Storage
export const uploadImageToSupabase = async (file: File, folder?: string): Promise<string> => {
  try {
    // Verificar que el archivo sea válido
    if (!file || file.size === 0) {
      throw new Error('Archivo inválido o vacío')
    }

    // Verificar que el archivo sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error(`Tipo de archivo no válido: ${file.type}. Solo se permiten imágenes.`)
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData()
    formData.append('file', file)
    if (folder) {
      formData.append('folder', folder)
    }
    
    // Registrar información del archivo que se va a subir
    console.log(`Preparando subida de imagen: ${file.name} (${file.size} bytes, tipo: ${file.type})`)
    
    // Determinar la URL base para la API
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 
        (process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` :
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3000'))
    
    console.log(`Enviando imagen a: ${baseUrl}/api/admin/imagenes`)
    
    // Llamar a la API Route para subir la imagen con un timeout más largo
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout
    
    const response = await fetch(`${baseUrl}/api/admin/imagenes`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      let errorMessage = `Error HTTP: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = `Error al subir imagen: ${errorData.error || response.statusText}`
      } catch (e) {
        // Si no podemos parsear la respuesta como JSON, usamos el mensaje de error HTTP
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    
    if (!data.success || !data.url) {
      throw new Error('Error al obtener la URL de la imagen')
    }
    
    console.log(`Imagen subida exitosamente. URL: ${data.url}`)
    
    // Verificar que la URL sea válida
    if (!data.url.startsWith('http')) {
      throw new Error(`URL de imagen inválida: ${data.url}`)
    }
    
    return data.url
  } catch (error) {
    console.error('Error al subir imagen:', error)
    throw error
  }
}

// Función para extraer ID de video de YouTube de una URL
export const getYoutubeVideoId = (url: string): string | null => {
  // Patrones de URL de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/user\/[^/]+\/[^/]+\/|youtube\.com\/[^/]+\/[^/]+\/|youtube\.com\/attribution_link\?.*v%3D|youtube\.com\/attribution_link\?.*v=)([^"&?/ ]{11})/i,
    /(?:youtube\.com\/shorts\/)([^"&?/ ]{11})/i
  ]
  
  // Probar cada patrón
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Función para calcular el conteo de caracteres y palabras
export const calculateCharacterCount = (text: string) => {
  // Eliminar etiquetas HTML para contar solo el texto
  const plainText = text.replace(/<[^>]*>/g, '')
  
  // Contar caracteres
  const characters = plainText.length
  
  // Contar palabras (dividir por espacios y filtrar elementos vacíos)
  const words = plainText.split(/\s+/).filter(word => word.length > 0).length
  
  return { characters, words }
}

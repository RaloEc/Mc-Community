import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'

export async function POST(request: NextRequest) {
  try {
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient()
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el cliente de servicio' },
        { status: 500 }
      )
    }

    // Obtener los datos del formulario
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Generar nombre de archivo único
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `noticias/${fileName}`

    // Convertir el archivo a ArrayBuffer para subirlo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Subir el archivo usando el cliente de servicio
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('imagenes')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 400 }
      )
    }

    // Obtener la URL pública
    const { data: urlData } = serviceClient.storage
      .from('imagenes')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        url: urlData.publicUrl
      }
    })
  } catch (error: any) {
    console.error('Error en la API de carga de archivos:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}

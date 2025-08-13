import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { v4 as uuidv4 } from 'uuid';

// Tamaño máximo permitido para imágenes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Tipos MIME permitidos para imágenes
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export async function POST(request: Request) {
  try {
    console.log('Recibida solicitud para subir imagen');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string | null;
    
    if (!file) {
      console.error('No se proporcionó ningún archivo');
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }
    
    // Validar tipo de archivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error(`Tipo de archivo no permitido: ${file.type}`);
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.` },
        { status: 400 }
      );
    }
    
    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      console.error(`Archivo demasiado grande: ${file.size} bytes`);
      return NextResponse.json(
        { error: `El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }
    
    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      console.error('El archivo está vacío');
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      );
    }

    console.log(`Procesando archivo: ${file.name}, tipo: ${file.type}, tamaño: ${file.size} bytes`);

    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();
    
    if (!serviceClient) {
      console.error('No se pudo obtener el cliente de servicio de Supabase');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const basePath = folder || 'noticias';
    const filePath = `${basePath}/${fileName}`;
    
    console.log(`Nombre de archivo generado: ${filePath}`);
    
    try {
      // Convertir el archivo a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);
      
      if (fileBuffer.length === 0) {
        console.error('Buffer de archivo vacío');
        return NextResponse.json(
          { error: 'El contenido del archivo está vacío' },
          { status: 400 }
        );
      }
      
      console.log(`Preparando subida a Supabase Storage, tamaño del buffer: ${fileBuffer.length} bytes`);
      
      // Verificar que el bucket existe
      const { data: buckets, error: bucketsError } = await serviceClient
        .storage
        .listBuckets();
      
      console.log('Buckets disponibles en Supabase:', buckets?.map(b => b.name));
      
      if (bucketsError) {
        console.error('Error al listar buckets:', bucketsError);
        return NextResponse.json(
          { error: `Error al verificar buckets: ${bucketsError.message}` },
          { status: 500 }
        );
      }
      
      // Verificar si el bucket 'imagenes' existe
      const bucketExists = buckets?.some(b => b.name === 'imagenes');
      
      if (!bucketExists) {
        console.error('El bucket "imagenes" no existe en Supabase');
        return NextResponse.json(
          { error: 'El bucket de almacenamiento no existe' },
          { status: 500 }
        );
      }
      
      // Subir archivo a Supabase Storage
      console.log(`Subiendo archivo a bucket 'imagenes', ruta: ${filePath}`);
      const { data, error } = await serviceClient
        .storage
        .from('imagenes')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          contentType: file.type, // Especificar el tipo MIME correcto
          upsert: true // Cambiar a true para sobrescribir si existe
        });
      
      if (error) {
        console.error('Error al subir imagen a Supabase:', error);
        return NextResponse.json(
          { error: `Error al subir imagen: ${error.message}` },
          { status: 500 }
        );
      }
      
      if (!data) {
        console.error('No se recibieron datos después de la subida');
        return NextResponse.json(
          { error: 'Error al subir imagen: no se recibieron datos' },
          { status: 500 }
        );
      }
      
      console.log('Imagen subida correctamente a Supabase Storage');
      
      // Obtener URL pública
      const { data: urlData } = serviceClient
        .storage
        .from('imagenes')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        console.error('No se pudo obtener la URL pública');
        return NextResponse.json(
          { error: 'Error al obtener la URL pública de la imagen' },
          { status: 500 }
        );
      }
      
      const publicUrl = urlData.publicUrl;
      console.log(`URL pública generada: ${publicUrl}`);
      
      return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        message: 'Imagen subida correctamente',
        path: filePath,
        size: file.size
      });
    } catch (uploadError: any) {
      console.error('Error durante el proceso de subida:', uploadError);
      return NextResponse.json(
        { error: `Error al procesar la imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error general al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    );
  }
}

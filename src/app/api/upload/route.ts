import { NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase-server';
import { getServiceClient } from '@/utils/supabase-service';

export async function POST(request: Request) {
  try {
    // Obtener el archivo y el ID de usuario de la solicitud
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      );
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }
    
    // Validar el tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }
    
    // Limitar el tamaño del archivo (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. El tamaño máximo es 2MB' },
        { status: 400 }
      );
    }
    
    // Generar un nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Obtener el cliente de servicio para operaciones administrativas
    const serviceClient = getServiceClient();
    
    // Verificar si el bucket tiene políticas públicas
    try {
      await serviceClient.storage.from('profiles').getPublicUrl('test.txt');
    } catch (e) {
      console.error('Error al verificar bucket público:', e);
    }
    
    // Subir el archivo a Supabase Storage
    const { data, error: uploadError } = await serviceClient.storage
      .from('profiles')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Error al subir la imagen:', uploadError);
      return NextResponse.json(
        { error: `Error al subir la imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    // Intentar obtener una URL firmada (con tiempo de expiración largo) en lugar de una URL pública
    // Esto puede evitar problemas de permisos
    const { data: signedUrlData } = await serviceClient.storage
      .from('profiles')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // URL válida por 1 año
      
    // También obtenemos la URL pública como respaldo
    const { data: { publicUrl } } = serviceClient.storage
      .from('profiles')
      .getPublicUrl(filePath);
      
    // Usar la URL firmada si está disponible, de lo contrario usar la URL pública
    const imageUrl = signedUrlData?.signedUrl || publicUrl;
    console.log('URL de imagen generada:', imageUrl);
    
    // Verificar si podemos hacer la imagen pública
    try {
      // Actualizar la política de acceso público si es necesario
      // Nota: Esto requiere permisos de administrador en Supabase
      // y normalmente se haría desde la consola de Supabase
      
      // En su lugar, vamos a intentar actualizar los metadatos del archivo
      await serviceClient.storage.from('profiles').update(
        filePath,
        fileBuffer,
        {
          contentType: file.type,
          upsert: true,
          cacheControl: '3600'
        }
      );
      
      console.log('Archivo actualizado con éxito');
    } catch (e) {
      console.error('Error al actualizar el archivo:', e);
      // Continuamos aunque falle
    }
    
    // Actualizar el perfil del usuario con la nueva URL de avatar
    const { error: updateError } = await serviceClient
      .from('perfiles')
      .update({ avatar_url: imageUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error al actualizar el perfil:', updateError);
      return NextResponse.json(
        { error: `Error al actualizar el perfil: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error: any) {
    console.error('Error en la API de subida:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

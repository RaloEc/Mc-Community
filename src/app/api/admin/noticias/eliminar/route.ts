import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { revalidatePath } from 'next/cache';

// Función auxiliar para revalidar rutas de noticias
function revalidarRutasNoticias() {
  revalidatePath('/noticias');
  revalidatePath('/noticias/[id]', 'layout');
  revalidatePath('/admin/noticias');
  revalidatePath('/');
}

export async function DELETE(request: Request) {
  try {
    // Obtener el ID de la noticia de la URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('API: Iniciando eliminación de noticia con ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la noticia' },
        { status: 400 }
      );
    }

    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();

    // Primero eliminar las relaciones en la tabla noticias_categorias
    console.log('API: Eliminando relaciones de categorías');
    const { error: errorRelaciones } = await serviceClient
      .from('noticias_categorias')
      .delete()
      .eq('noticia_id', id);
    
    if (errorRelaciones) {
      console.error('API: Error al eliminar relaciones de categorías:', errorRelaciones);
      // Continuamos a pesar del error para intentar eliminar la noticia
    }
    
    // Luego eliminar la noticia
    console.log('API: Eliminando noticia');
    const { error } = await serviceClient
      .from('noticias')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('API: Error al eliminar noticia:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la noticia', details: error },
        { status: 500 }
      );
    }
    
    // Revalidar rutas para actualizar la caché
    revalidarRutasNoticias();
    
    console.log('API: Noticia eliminada correctamente');
    return NextResponse.json(
      { success: true, message: 'Noticia eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API: Error en la ruta de eliminación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error },
      { status: 500 }
    );
  }
}

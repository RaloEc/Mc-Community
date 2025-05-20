import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { revalidatePath } from 'next/cache';
import { Noticia } from '@/types';

export const dynamic = 'force-dynamic'; // Forzar modo dinámico, sin caché
export const revalidate = 0; // No usar caché

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== INICIO API ROUTE - OBTENER NOTICIA INDIVIDUAL ===');
    const id = params.id;
    console.log(`Solicitando noticia con ID: ${id}`);
    
    if (!id) {
      console.error('Error: ID de noticia no proporcionado');
      return NextResponse.json(
        { error: 'ID de noticia no proporcionado' },
        { status: 400 }
      );
    }

    // Obtener el cliente de servicio para saltarse las restricciones RLS
    console.log('Obteniendo cliente de servicio de Supabase...');
    const serviceClient = getServiceClient();
    
    if (!serviceClient) {
      console.error('Error: No se pudo obtener el cliente de servicio de Supabase');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    console.log('Cliente de servicio obtenido correctamente');

    // Obtener la noticia desde Supabase
    console.log(`Consultando noticia con ID ${id} en Supabase...`);
    const { data: noticia, error } = await serviceClient
      .from('noticias')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error al obtener noticia:', error);
      console.log('Código de error:', error.code);
      console.log('Mensaje de error:', error.message);
      console.log('Detalles:', error.details);
      return NextResponse.json(
        { error: `Error al obtener noticia: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!noticia) {
      console.error(`No se encontró ninguna noticia con ID ${id}`);
      return NextResponse.json(
        { error: 'Noticia no encontrada' },
        { status: 404 }
      );
    }
    
    console.log('Noticia encontrada:', {
      id: noticia.id,
      titulo: noticia.titulo,
      fecha: noticia.fecha_publicacion,
      autor_id: noticia.autor_id || noticia.autor,
      tiene_imagen_portada: !!noticia.imagen_portada,
      longitud_contenido: typeof noticia.contenido === 'string' ? noticia.contenido.length : 0
    });
    
    // Verificar imagen de portada
    if (noticia.imagen_portada && typeof noticia.imagen_portada === 'string') {
      console.log(`Imagen de portada encontrada: ${noticia.imagen_portada}`);
      try {
        new URL(noticia.imagen_portada);
        console.log('URL de imagen de portada válida');
      } catch (error) {
        console.error('URL de imagen de portada inválida:', error);
      }
    } else {
      console.log('La noticia no tiene imagen de portada');
    }
    
    // Analizar contenido para detectar imágenes - Esto solo funciona en el navegador, no en el servidor
    // En el servidor Next.js no tenemos acceso a document, por lo que comentamos este código
    /*
    if (noticia.contenido) {
      console.log('Analizando contenido para detectar imágenes en la API...');
      // Este código solo funciona en el navegador, no en el servidor
    }
    */
    
    // En su lugar, hacemos un análisis simple de cadenas para buscar imágenes
    if (noticia.contenido && typeof noticia.contenido === 'string') {
      console.log('Analizando contenido para detectar imágenes en la API (análisis de cadenas)...');
      
      // Contar cuántas etiquetas img hay en el contenido
      const imgTagCount = (noticia.contenido.match(/<img[^>]+>/g) || []).length;
      console.log(`Se encontraron aproximadamente ${imgTagCount} etiquetas de imagen en el contenido`);
      
      // Buscar URLs de Supabase en el contenido
      const supabaseUrlCount = (noticia.contenido.match(/supabase\.co\/storage\/v1\/object\/public/g) || []).length;
      console.log(`Se encontraron aproximadamente ${supabaseUrlCount} URLs de Supabase en el contenido`);
      
      // Buscar URLs de blob en el contenido
      const blobUrlCount = (noticia.contenido.match(/blob:/g) || []).length;
      if (blobUrlCount > 0) {
        console.error(`Se encontraron ${blobUrlCount} URLs de blob en el contenido, lo cual no debería ocurrir`);
      }
      
      // Buscar URLs de datos en el contenido
      const dataUrlCount = (noticia.contenido.match(/data:image/g) || []).length;
      if (dataUrlCount > 0) {
        console.error(`Se encontraron ${dataUrlCount} URLs de datos en el contenido, lo cual no debería ocurrir`);
      }
    }
    
    // Obtener las categorías de la noticia
    let categorias = [];
    
    // Obtener las relaciones de categorías para esta noticia
    const { data: relaciones, error: errorRelaciones } = await serviceClient
      .from('noticias_categorias')
      .select('categoria_id')
      .eq('noticia_id', id);
      
    if (!errorRelaciones && relaciones && relaciones.length > 0) {
      const categoriaIds = relaciones.map(rel => rel.categoria_id);
      
      const { data: categoriasData, error: errorCategorias } = await serviceClient
        .from('categorias')
        .select('id, nombre')
        .in('id', categoriaIds);
        
      if (!errorCategorias && categoriasData) {
        categorias = categoriasData;
      }
    }
    
    // Buscar perfil del autor si existe
    let autorNombre = 'Desconocido';
    let autorColor = '#3b82f6'; // Color azul por defecto
    let autorAvatar = null; // URL de la imagen de perfil del autor
    
    // Determinar el ID del autor (puede estar en autor_id o en autor si es UUID)
    let autorId = null;
    
    if (noticia.autor_id && typeof noticia.autor_id === 'string') {
      autorId = noticia.autor_id;
      console.log(`Usando autor_id: ${autorId}`);
    } else if (typeof noticia.autor === 'string' && 
               /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noticia.autor)) {
      autorId = noticia.autor;
      console.log(`Autor parece ser un UUID: ${autorId}`);
    } else {
      console.log(`No se encontró un ID válido. Autor original: ${noticia.autor}`);
    }
    
    // Si tenemos un ID de autor, buscar su perfil
    if (autorId) {
      const { data: perfil, error: errorPerfil } = await serviceClient
        .from('perfiles')
        .select('username, role, color, avatar_url')
        .eq('id', autorId)
        .single();
      
      if (errorPerfil) {
        console.error(`Error al buscar perfil para ID ${autorId}:`, errorPerfil);
      }
      
      if (perfil) {
        console.log(`Perfil encontrado para ID ${autorId}:`, perfil);
        autorNombre = typeof perfil.username === 'string' ? perfil.username : 'Usuario';
        
        // Guardar URL de avatar si existe
        if (perfil.avatar_url && typeof perfil.avatar_url === 'string') {
          autorAvatar = perfil.avatar_url;
          console.log(`Avatar encontrado: ${autorAvatar}`);
        }
        
        // Usar color personalizado si existe
        if (perfil.color && typeof perfil.color === 'string') {
          autorColor = perfil.color;
          console.log(`Color personalizado encontrado: ${autorColor}`);
        } else {
          // Asignar color según el rol si no hay color personalizado
          console.log(`Rol del perfil: ${perfil.role}`);
          if (perfil.role === 'admin') {
            autorColor = '#ef4444'; // Rojo para administradores
            console.log('Color establecido a rojo para admin');
          } else if (perfil.role === 'moderator') {
            autorColor = '#f59e0b'; // Ámbar para moderadores
            console.log('Color establecido a ámbar para moderador');
          } else {
            console.log('Rol no reconocido, usando color por defecto');
          }
        }
        console.log(`Color final del autor: ${autorColor}`);
      } else {
        console.log(`No se encontró perfil para ID ${autorId}`);
      }
    } 
    // Si no tenemos ID pero tenemos un correo, usar la parte antes del @ como nombre
    else if (typeof noticia.autor === 'string' && noticia.autor.includes('@')) {
      const correo = noticia.autor as string;
      // Usar la parte del correo antes del @ como nombre de usuario
      const nombreUsuario = correo.split('@')[0];
      console.log(`Usando parte del correo como nombre de usuario: ${nombreUsuario}`);
      autorNombre = nombreUsuario;
    }

    
    // Devolver la noticia con sus categorías y datos del autor
    return NextResponse.json({
      success: true, 
      data: {
        ...noticia,
        categorias: categorias || [],
        autor_nombre: autorNombre,
        autor_color: autorColor,
        autor_avatar: autorAvatar
      }
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

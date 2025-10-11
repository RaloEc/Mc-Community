import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/utils/supabase-service';

export async function DELETE(request: Request) {
  try {
    // Obtener el ID del comentario de la URL
    const url = new URL(request.url);
    const comment_id = url.searchParams.get('id');
    
    console.log('[API Comentarios Delete] Recibiendo solicitud DELETE para comentario ID:', comment_id);
    
    if (!comment_id) {
      return NextResponse.json(
        { success: false, error: 'ID de comentario no proporcionado' },
        { status: 400 }
      );
    }
    
    // Obtener usuario autenticado
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para eliminar un comentario' },
        { status: 401 }
      );
    }
    
    const serviceSupabase = getServiceClient();
    
    // Primero intentamos buscar en la tabla comentarios
    console.log('[API Comentarios Delete] Buscando comentario con ID:', comment_id);
    
    const { data: existingComment, error: commentError } = await serviceSupabase
      .from('comentarios')
      .select('id, usuario_id')
      .eq('id', comment_id)
      .single();
      
    // Si no se encuentra en comentarios, buscar en foro_posts
    let isForoPost = false;
    let existingForoPost = null;
    
    if (commentError || !existingComment) {
      console.log('[API Comentarios Delete] Buscando en foro_posts...');
      const { data: forumPost, error: forumError } = await serviceSupabase
        .from('foro_posts')
        .select('id, autor_id')
        .eq('id', comment_id)
        .single();
        
      if (!forumError && forumPost) {
        isForoPost = true;
        existingForoPost = forumPost;
        console.log('[API Comentarios Delete] Encontrado post del foro:', forumPost.id);
      } else {
        console.error('[API Comentarios Delete] Error: El comentario no existe en ninguna tabla');
        return NextResponse.json(
          { success: false, error: 'El comentario no existe' },
          { status: 404 }
        );
      }
    }
    
    // Verificar que el usuario actual es el autor del comentario
    const authorId = isForoPost ? existingForoPost.autor_id : existingComment.usuario_id;
    
    if (authorId !== user.id) {
      console.error('[API Comentarios Delete] Error: El usuario no es el autor del comentario');
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar este comentario' },
        { status: 403 }
      );
    }
    
    // Antes de eliminar, verificar si hay citas a este comentario
    // Si hay citas, necesitamos actualizar la tabla de referencias para marcar el comentario como eliminado
    
    // SIEMPRE hacer soft delete para mantener registro
    console.log('[API Comentarios Delete] Haciendo soft delete del comentario');
    
    if (isForoPost) {
      // Marcar como eliminado en foro_posts (sin modificar el contenido)
      console.log('[API Comentarios Delete] Actualizando foro_posts con ID:', comment_id);
      console.log('[API Comentarios Delete] Usuario que elimina:', user.id);
      
      const { data: updateData, error: updateError } = await serviceSupabase
        .from('foro_posts')
        .update({ 
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', comment_id)
        .select();
        
      console.log('[API Comentarios Delete] Resultado de actualización:', { updateData, updateError });
        
      if (updateError) {
        console.error('[API Comentarios Delete] Error al hacer soft delete:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al eliminar el comentario: ${updateError.message}`, details: updateError },
          { status: 500 }
        );
      }
      
      if (!updateData || updateData.length === 0) {
        console.error('[API Comentarios Delete] No se actualizó ningún registro');
        return NextResponse.json(
          { success: false, error: 'No se pudo actualizar el comentario. Puede que ya esté eliminado o no exista.' },
          { status: 404 }
        );
      }
    } else {
      // Para comentarios de noticias, usar soft delete (sin modificar el contenido)
      const { error: updateError } = await serviceSupabase
        .from('comentarios')
        .update({ 
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', comment_id);
        
      if (updateError) {
        console.error('[API Comentarios Delete] Error al hacer soft delete:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al eliminar el comentario: ${updateError.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comentario eliminado correctamente',
      softDelete: true
    });
    
  } catch (error) {
    console.error('[API Comentarios Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

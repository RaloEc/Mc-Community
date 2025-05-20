import { NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase-server';
import { getServiceClient } from '@/utils/supabase-service';
import { Comentario, HistorialEdicion } from '@/types';

// GET para obtener comentarios de una entidad específica
export async function GET(request: Request) {
  try {
    console.log('[API Comentarios] Recibiendo solicitud GET');
    const { searchParams } = new URL(request.url);
    const tipoEntidad = searchParams.get('tipo_entidad');
    const entidadId = searchParams.get('entidad_id');
    const limite = parseInt(searchParams.get('limite') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[API Comentarios] Parámetros de búsqueda:', { tipoEntidad, entidadId, limite, offset });

    // Validar parámetros requeridos
    if (!tipoEntidad || !entidadId) {
      console.log('[API Comentarios] Error: Faltan parámetros requeridos');
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Obtener comentarios con información del usuario
    const supabase = getServiceClient();
    // Obtener comentarios principales (sin padre) con información de usuario usando un join con la tabla perfiles
    const { data: comentariosPrincipales, error } = await supabase
      .from('comentarios')
      .select(`
        *,
        perfiles:usuario_id(id, username, avatar_url, role)
      `)
      .eq('tipo_entidad', tipoEntidad)
      .eq('entidad_id', entidadId)
      .is('comentario_padre_id', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1);
      
    // Obtener todas las respuestas para estos comentarios principales
    let comentarios = comentariosPrincipales;
    if (comentariosPrincipales && comentariosPrincipales.length > 0) {
      const ids = comentariosPrincipales.map(c => c.id);
      const { data: respuestas, error: respuestasError } = await supabase
        .from('comentarios')
        .select(`
          *,
          perfiles:usuario_id(id, username, avatar_url, role)
        `)
        .in('comentario_padre_id', ids)
        .order('created_at', { ascending: true });
        
      if (respuestasError) {
        console.error('[API Comentarios] Error al obtener respuestas:', respuestasError);
      } else if (respuestas && respuestas.length > 0) {
        // Agrupar las respuestas por comentario padre
        const respuestasPorPadre: Record<string, any[]> = {};
        respuestas.forEach(respuesta => {
          if (!respuestasPorPadre[respuesta.comentario_padre_id]) {
            respuestasPorPadre[respuesta.comentario_padre_id] = [];
          }
          respuestasPorPadre[respuesta.comentario_padre_id].push(respuesta);
        });
        
        // Asignar las respuestas a sus comentarios padre
        comentarios = comentariosPrincipales.map(comentario => ({
          ...comentario,
          respuestas: respuestasPorPadre[comentario.id] || []
        }));
      }
    }
      
    if (error) {
      console.error('[API Comentarios] Error al obtener comentarios:', error);
      return NextResponse.json(
        { success: false, error: `Error al obtener comentarios: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`[API Comentarios] Se encontraron ${comentarios?.length || 0} comentarios`);

    // Obtener el total de comentarios para esta entidad
    const { count, error: countError } = await supabase
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_entidad', tipoEntidad)
      .eq('entidad_id', entidadId);

    if (countError) {
      console.error('Error al contar comentarios:', countError);
    }

    // Retornar los comentarios y el total
    const responseData = {
      success: true,
      data: comentarios,
      total: count || 0,
      offset,
      limite,
    };
    
    console.log('[API Comentarios] Enviando respuesta exitosa');
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API Comentarios] Error en la API de comentarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST para crear un nuevo comentario
// PUT para editar un comentario existente
export async function PUT(request: Request) {
  try {
    console.log('[API Comentarios] Recibiendo solicitud PUT');
    const body = await request.json();
    const { id, contenido, usuario_id } = body;
    
    console.log('[API Comentarios] Datos recibidos para edición:', { 
      id,
      contenido: contenido?.substring(0, 20) + '...', 
      usuario_id
    });

    // Validar datos requeridos
    if (!id || !contenido || !usuario_id) {
      console.log('[API Comentarios] Error: Faltan campos requeridos para edición');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceClient();
    
    // Verificar que el comentario exista y pertenezca al usuario
    const { data: comentarioExistente, error: errorConsulta } = await supabase
      .from('comentarios')
      .select('id, usuario_id, historial_ediciones, contenido')
      .eq('id', id)
      .single();
    
    if (errorConsulta) {
      console.error('[API Comentarios] Error al verificar comentario:', errorConsulta);
      return NextResponse.json(
        { success: false, error: 'No se encontró el comentario' },
        { status: 404 }
      );
    }
    
    // Verificar que el comentario pertenezca al usuario
    if (comentarioExistente.usuario_id !== usuario_id) {
      console.error('[API Comentarios] Error: Usuario no autorizado para editar este comentario');
      return NextResponse.json(
        { success: false, error: 'No estás autorizado para editar este comentario' },
        { status: 403 }
      );
    }
    
    // Preparar el historial de ediciones
    const fechaActual = new Date().toISOString();
    let historialActualizado;
    
    if (comentarioExistente.historial_ediciones) {
      // Si ya existe un historial, añadir la nueva versión
      const historialActual = comentarioExistente.historial_ediciones;
      historialActualizado = {
        original: historialActual.original,
        versiones: [
          ...historialActual.versiones,
          {
            contenido,
            fecha: fechaActual,
            version: historialActual.versiones.length + 1
          }
        ]
      };
    } else {
      // Si es la primera edición, crear el historial
      historialActualizado = {
        original: comentarioExistente.contenido,
        versiones: [
          {
            contenido,
            fecha: fechaActual,
            version: 1
          }
        ]
      };
    }
    
    // Actualizar el comentario
    const { data: comentarioActualizado, error } = await supabase
      .from('comentarios')
      .update({
        contenido,
        historial_ediciones: historialActualizado,
        updated_at: fechaActual
      })
      .eq('id', id)
      .select(`
        *,
        perfiles:usuario_id(id, username, avatar_url, role)
      `)
      .single();
    
    if (error) {
      console.error('[API Comentarios] Error al actualizar comentario:', error);
      return NextResponse.json(
        { success: false, error: `Error al actualizar el comentario: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('[API Comentarios] Comentario actualizado exitosamente:', id);
    
    return NextResponse.json({
      success: true,
      data: comentarioActualizado,
    });
  } catch (error) {
    console.error('[API Comentarios] Error en la API de edición de comentarios:', error);
    return NextResponse.json(
      { success: false, error: `Error interno del servidor: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE para eliminar un comentario
export async function DELETE(request: Request) {
  try {
    console.log('[API Comentarios] Recibiendo solicitud DELETE');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const usuario_id = searchParams.get('usuario_id');
    
    console.log('[API Comentarios] Datos recibidos para eliminación:', { id, usuario_id });

    // Validar datos requeridos
    if (!id || !usuario_id) {
      console.log('[API Comentarios] Error: Faltan parámetros requeridos para eliminación');
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceClient();
    
    // Verificar que el comentario exista y pertenezca al usuario
    const { data: comentarioExistente, error: errorConsulta } = await supabase
      .from('comentarios')
      .select('id, usuario_id')
      .eq('id', id)
      .single();
    
    if (errorConsulta) {
      console.error('[API Comentarios] Error al verificar comentario:', errorConsulta);
      return NextResponse.json(
        { success: false, error: 'No se encontró el comentario' },
        { status: 404 }
      );
    }
    
    // Verificar que el comentario pertenezca al usuario
    if (comentarioExistente.usuario_id !== usuario_id) {
      console.error('[API Comentarios] Error: Usuario no autorizado para eliminar este comentario');
      return NextResponse.json(
        { success: false, error: 'No estás autorizado para eliminar este comentario' },
        { status: 403 }
      );
    }
    
    // Eliminar el comentario
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API Comentarios] Error al eliminar comentario:', error);
      return NextResponse.json(
        { success: false, error: `Error al eliminar el comentario: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('[API Comentarios] Comentario eliminado exitosamente:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });
  } catch (error) {
    console.error('[API Comentarios] Error en la API de eliminación de comentarios:', error);
    return NextResponse.json(
      { success: false, error: `Error interno del servidor: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API Comentarios] Recibiendo solicitud POST');
    const body = await request.json();
    const { contenido, usuario_id, tipo_entidad, entidad_id, comentario_padre_id } = body;
    
    console.log('[API Comentarios] Datos recibidos:', { 
      contenido: contenido?.substring(0, 20) + '...', 
      usuario_id, 
      tipo_entidad, 
      entidad_id,
      comentario_padre_id: comentario_padre_id || 'ninguno (comentario principal)'
    });

    // Validar datos requeridos
    if (!contenido || !tipo_entidad || !entidad_id) {
      console.log('[API Comentarios] Error: Faltan campos requeridos');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Si es una respuesta, verificar que el comentario padre exista
    if (comentario_padre_id) {
      const supabase = getServiceClient();
      const { data: comentarioPadre, error: errorConsulta } = await supabase
        .from('comentarios')
        .select('id')
        .eq('id', comentario_padre_id)
        .single();
        
      if (errorConsulta) {
        console.error('[API Comentarios] Error: El comentario padre no existe');
        return NextResponse.json(
          { success: false, error: 'El comentario padre no existe' },
          { status: 404 }
        );
      }
    }
    
    // Validar que el usuario esté autenticado
    if (!usuario_id) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para comentar' },
        { status: 401 }
      );
    }

    // Insertar el comentario
    const supabase = getServiceClient();
    console.log('[API Comentarios] Usando cliente de servicio para insertar comentario');
    
    try {
      let data: any = null;
      const { data: comentarioData, error } = await supabase
        .from('comentarios')
        .insert({
          contenido,
          usuario_id,
          tipo_entidad,
          entidad_id,
          comentario_padre_id: comentario_padre_id || null,
        })
        .select(`
          *,
          perfiles:usuario_id(id, username, avatar_url, role)
        `)
        .single();

      if (error) {
        console.error('[API Comentarios] Error al crear comentario:', error);
        return NextResponse.json(
          { success: false, error: `Error al crear el comentario: ${error.message}` },
          { status: 500 }
        );
      }
      
      data = comentarioData;
      console.log('[API Comentarios] Comentario creado exitosamente:', data?.id);
      
      return NextResponse.json({
        success: true,
        data,
      });
    } catch (insertError) {
      console.error('[API Comentarios] Excepción al insertar comentario:', insertError);
      return NextResponse.json(
        { success: false, error: `Excepción al insertar: ${insertError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API de comentarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

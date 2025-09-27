import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const { userId, username, color, avatar_url, bio, ubicacion, sitio_web, banner_url } = await request.json();
    
    // Obtener el ID de usuario de la sesión si no se proporciona
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      // Obtener el ID de usuario de la sesión actual
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'No se pudo determinar el ID de usuario' },
          { status: 401 }
        );
      }
      
      userIdToUse = session.user.id;
    }
    
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Actualizando perfil para usuario: ${userIdToUse}`);
    console.log(`[API] Nuevos valores - Username: ${username}, Color: ${color}, Avatar URL: ${avatar_url || 'No cambiada'}, Banner URL: ${banner_url || 'No cambiada'}`);
    console.log(`[API] Campos adicionales - Bio: ${bio ? 'Presente' : 'No cambiada'}, Ubicación: ${ubicacion || 'No cambiada'}, Sitio web: ${sitio_web || 'No cambiado'}`);
    
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const supabase = getServiceClient();
    
    // Construir objeto de actualización
    const updateData: any = {
      username: username.trim()
    };
    
    // Agregar color si está presente
    if (color) {
      updateData.color = color;
    }
    
    // Agregar avatar_url si está presente
    if (avatar_url) {
      updateData.avatar_url = avatar_url;
    }
    // Agregar banner_url si está presente (permitir null para eliminar)
    if (banner_url !== undefined) {
      updateData.banner_url = banner_url;
    }
    
    // Agregar bio si está presente
    if (bio !== undefined) {
      updateData.bio = bio;
    }
    
    // Agregar ubicacion si está presente
    if (ubicacion !== undefined) {
      updateData.ubicacion = ubicacion;
    }
    
    // Agregar sitio_web si está presente
    if (sitio_web !== undefined) {
      updateData.sitio_web = sitio_web;
    }
    
    // Primero verificar si el perfil existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', userIdToUse)
      .single();

    if (checkError || !existingProfile) {
      console.log('[API] Perfil no encontrado, creando nuevo perfil...');
      
      // Crear el perfil si no existe
      const { data: newProfile, error: createError } = await supabase
        .from('perfiles')
        .insert({
          id: userIdToUse,
          ...updateData,
          role: 'user', // Rol por defecto
          activo: true
        })
        .select()
        .single();

      if (createError) {
        console.error('[API] Error al crear perfil:', createError);
        return NextResponse.json(
          { error: createError.message || 'Error al crear el perfil' },
          { status: 500 }
        );
      }

      console.log('[API] Perfil creado correctamente:', newProfile);
      return NextResponse.json({
        success: true,
        message: 'Perfil creado correctamente',
        data: newProfile
      });
    }

    // Actualizar el perfil existente
    const { data, error } = await supabase
      .from('perfiles')
      .update(updateData)
      .eq('id', userIdToUse)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Error al actualizar perfil:', error);
      
      // Verificar si el error está relacionado con la columna color
      if (error.message && error.message.includes('color')) {
        console.log('[API] Error con la columna color, intentando actualizar sin el color');
        
        // Crear un nuevo objeto de actualización sin el color
        const fallbackUpdateData: any = {
          username: username.trim()
        };
        
        // Mantener avatar_url si estaba presente
        if (avatar_url) {
          fallbackUpdateData.avatar_url = avatar_url;
        }
        
        // Intentar actualizar sin el color
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('perfiles')
          .update(fallbackUpdateData)
          .eq('id', userIdToUse)
          .select()
          .single();
        
        if (fallbackError) {
          console.error('[API] Error al actualizar sin el color:', fallbackError);
          return NextResponse.json(
            { error: fallbackError.message || 'Error al actualizar el perfil' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Perfil actualizado (el color no pudo ser guardado)',
          data: fallbackData
        });
      }
      
      return NextResponse.json(
        { error: error.message || 'Error al actualizar el perfil' },
        { status: 500 }
      );
    }
    
    console.log('[API] Perfil actualizado correctamente:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data
    });
  } catch (error: any) {
    console.error('[API] Error inesperado al actualizar perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

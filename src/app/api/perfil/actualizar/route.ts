import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const { userId, username, color } = await request.json();
    
    // Validaciones básicas
    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      );
    }
    
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Actualizando perfil para usuario: ${userId}`);
    console.log(`[API] Nuevos valores - Username: ${username}, Color: ${color}`);
    
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
    
    // Actualizar el perfil en Supabase
    const { data, error } = await supabase
      .from('perfiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Error al actualizar perfil:', error);
      
      // Verificar si el error está relacionado con la columna color
      if (error.message && error.message.includes('color')) {
        console.log('[API] Error con la columna color, intentando actualizar solo el username');
        
        // Intentar actualizar solo el username
        const { data: usernameData, error: usernameError } = await supabase
          .from('perfiles')
          .update({ username: username.trim() })
          .eq('id', userId)
          .select()
          .single();
        
        if (usernameError) {
          console.error('[API] Error al actualizar solo el username:', usernameError);
          return NextResponse.json(
            { error: usernameError.message || 'Error al actualizar el perfil' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Nombre de usuario actualizado (el color no pudo ser guardado)',
          data: usernameData
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

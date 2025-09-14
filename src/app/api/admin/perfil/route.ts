import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';

// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('API Route - Obteniendo perfil de usuario');
    
    // Obtener el ID del usuario de la sesión
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('No se proporcionó ID de usuario');
      return NextResponse.json(
        { error: 'No se proporcionó ID de usuario' },
        { status: 400 }
      );
    }
    
    console.log('Buscando perfil para el usuario:', userId);
    
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();
    
    if (!serviceClient) {
      console.error('No se pudo obtener el cliente de servicio de Supabase');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    // Intentar obtener el perfil del usuario
    const { data: perfil, error } = await serviceClient
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error al obtener perfil:', error);
      
      // Si el error es que no existe la tabla, devolver un perfil vacío
      if (error.code === '42P01') {
        console.log('La tabla perfiles no existe');
        return NextResponse.json({
          success: true,
          data: {
            id: userId,
            username: null,
            nombre_completo: null
          }
        });
      }
      
      return NextResponse.json(
        { error: `Error al obtener perfil: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Perfil obtenido correctamente:', perfil);
    
    return NextResponse.json({
      success: true,
      data: perfil || {
        id: userId,
        username: null,
        nombre_completo: null
      }
    });
  } catch (error: any) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    );
  }
}

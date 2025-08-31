import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const { userId, username } = await request.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'Se requieren userId y username' },
        { status: 400 }
      );
    }

    console.log('Creando perfil para usuario:', { userId, username });

    // Usar el cliente de servicio para saltarse las políticas RLS
    const supabase = getServiceClient();

    // Crear perfil usando upsert para manejar posibles duplicados
    const { data, error } = await supabase
      .from('perfiles')
      .upsert(
        {
          id: userId,
          username,
          role: 'user',
          activo: true,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error al crear perfil:', error);
      
      // Intento alternativo si el primer método falla
      const { error: fallbackError } = await supabase
        .from('perfiles')
        .insert({
          id: userId,
          username,
          role: 'user',
          activo: true,
          created_at: new Date().toISOString(),
        });
      
      if (fallbackError) {
        console.error('Error en método alternativo:', fallbackError);
        return NextResponse.json(
          { error: `Error al crear perfil: ${fallbackError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Perfil creado correctamente' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error inesperado al crear perfil:', error);
    return NextResponse.json(
      { error: `Error inesperado: ${error.message}` },
      { status: 500 }
    );
  }
}

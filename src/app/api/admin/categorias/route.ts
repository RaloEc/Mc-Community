import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';

export async function GET() {
  try {
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();

    // Consultar las categorías usando el cliente de servicio
    const { data, error } = await serviceClient
      .from('categorias')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      console.error('Error al cargar categorías:', error);
      return NextResponse.json(
        { error: `Error al cargar categorías: ${error.message}` },
        { status: 500 }
      );
    }

    // Devolver las categorías
    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    });
  } catch (error) {
    console.error('Error al procesar la solicitud de categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

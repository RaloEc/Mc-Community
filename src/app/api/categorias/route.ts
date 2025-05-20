import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Forzar modo dinámico, sin caché
export const revalidate = 0; // No usar caché

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
      // En lugar de mostrar un error, devolver un array vacío
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
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

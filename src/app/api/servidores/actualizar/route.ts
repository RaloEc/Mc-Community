import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { id, ...datosServidor } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de servidor no proporcionado' },
        { status: 400 }
      );
    }

    // Llamar a la función de servicio para actualizar el servidor
    const { data, error } = await supabase
      .rpc('actualizar_servidor', {
        servidor_id: id,
        p_nombre: datosServidor.nombre,
        p_descripcion: datosServidor.descripcion,
        p_ip: datosServidor.ip,
        p_version: datosServidor.version,
        p_capacidad_jugadores: parseInt(datosServidor.capacidad_jugadores) || 100,
        p_tipo: datosServidor.tipo,
        p_imagen: datosServidor.imagen || null,
        p_destacado: datosServidor.destacado
      });
    
    if (error) {
      console.error('Error al actualizar servidor:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el servidor', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error al actualizar servidor:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error },
      { status: 500 }
    );
  }
}

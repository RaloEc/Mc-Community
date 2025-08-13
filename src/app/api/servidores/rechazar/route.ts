import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud no proporcionado' },
        { status: 400 }
      );
    }

    // Llamar a la función de servicio para rechazar la solicitud
    const { data, error } = await supabase
      .rpc('rechazar_solicitud_servidor', {
        solicitud_id: id
      });
    
    if (error) {
      console.error('Error al rechazar solicitud:', error);
      return NextResponse.json(
        { error: 'Error al rechazar la solicitud', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error },
      { status: 500 }
    );
  }
}

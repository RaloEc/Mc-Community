import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { 
      usuario_id, 
      tipo_sancion, 
      razon, 
      dias_duracion, 
      puntos, 
      notificar 
    } = body;

    if (!usuario_id || !tipo_sancion || !razon) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('aplicar_sancion_usuario', {
      p_usuario_id: usuario_id,
      p_tipo_sancion: tipo_sancion,
      p_razon: razon,
      p_dias_duracion: dias_duracion || null,
      p_puntos: puntos || 0,
      p_notificar: notificar !== false
    });

    if (error) {
      console.error('Error aplicando sanción:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sancion_id: data }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/admin/foro/sanciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const usuario_id = searchParams.get('usuario_id');

    if (!usuario_id) {
      return NextResponse.json(
        { error: 'Se requiere usuario_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('obtener_sanciones_activas_usuario', {
      p_usuario_id: usuario_id
    });

    if (error) {
      console.error('Error obteniendo sanciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sanciones: data });
  } catch (error) {
    console.error('Error en GET /api/admin/foro/sanciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

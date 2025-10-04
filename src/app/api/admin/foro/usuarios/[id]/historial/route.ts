import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const usuario_id = params.id;

    const { data, error } = await supabase.rpc('obtener_historial_moderacion_usuario', {
      p_usuario_id: usuario_id
    });

    if (error) {
      console.error('Error obteniendo historial:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ historial: data });
  } catch (error) {
    console.error('Error en GET /api/admin/foro/usuarios/[id]/historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

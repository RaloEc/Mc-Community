import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { reporte_ids, accion, resolucion } = body;

    if (!reporte_ids || !Array.isArray(reporte_ids) || !accion || !resolucion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos o formato incorrecto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('procesar_reportes_masivo', {
      p_reporte_ids: reporte_ids,
      p_accion: accion,
      p_resolucion: resolucion
    });

    if (error) {
      console.error('Error procesando reportes masivos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      procesados: data 
    });
  } catch (error) {
    console.error('Error en POST /api/admin/foro/reportes/masivo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

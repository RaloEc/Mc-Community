import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { hiloId, valorVoto } = await request.json();

    if (!hiloId || !valorVoto) {
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos: hiloId, valorVoto' 
      }, { status: 400 });
    }

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No autorizado' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar el token y obtener el usuario
    const supabase = getServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Token inválido' 
      }, { status: 401 });
    }

    // Obtener el voto actual del usuario para este hilo
    const { data: votoActual } = await supabase
      .from("foro_votos_hilos")
      .select("valor_voto")
      .eq("hilo_id", hiloId)
      .eq("usuario_id", user.id)
      .single();

    // Determinar si debemos eliminar el voto (si el usuario ya votó con el mismo valor)
    const shouldDelete = votoActual?.valor_voto === valorVoto;
    
    if (shouldDelete) {
      // Eliminar el voto
      await supabase
        .from("foro_votos_hilos")
        .delete()
        .match({ hilo_id: hiloId, usuario_id: user.id });
        
      return NextResponse.json({ 
        success: true,
        action: 'deleted',
        voto_usuario: 0
      });
    } else {
      // Insertar o actualizar el voto
      await supabase
        .from("foro_votos_hilos")
        .upsert(
          { 
            hilo_id: hiloId, 
            usuario_id: user.id, 
            valor_voto: valorVoto
          },
          { 
            onConflict: 'hilo_id,usuario_id'
          }
        );
        
      return NextResponse.json({ 
        success: true,
        action: 'upserted',
        voto_usuario: valorVoto
      });
    }

  } catch (error) {
    console.error('Error al procesar voto:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

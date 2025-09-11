import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Tipos estrictos para el body de la petición
interface VoteBody {
  value: -1 | 0 | 1; // -1: downvote, 0: quitar voto, 1: upvote
}

// Helper para obtener el total de votos del hilo
async function getVotesTotalFor(supabase: SupabaseClient<Database>, hiloId: string): Promise<{ total: number; userVote: -1 | 0 | 1 }> {
  // Obtener el voto del usuario actual si está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // Obtemos el total de votos directamente del hilo
  const { data: hilo, error } = await supabase
    .from('foro_hilos')
    .select('votos_conteo')
    .eq('id', hiloId)
    .single();
  
  if (error) {
    console.error('Error al obtener votos:', error);
    return { total: 0, userVote: 0 };
  }

  // Si no hay usuario, devolvemos solo el total
  if (!userId) {
    return { 
      total: hilo?.votos_conteo ?? 0, 
      userVote: 0 
    };
  }

  // Obtenemos el voto del usuario actual
  const { data: userVote } = await supabase
    .from('foro_votos_hilos')
    .select('valor')
    .eq('hilo_id', hiloId)
    .eq('usuario_id', userId)
    .single();

  return { 
    total: hilo?.votos_conteo ?? 0, 
    userVote: (userVote?.valor as -1 | 0 | 1) ?? 0 
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('Iniciando POST /api/foro/hilo/[id]/votar');
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Validar sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const hiloId = params.id;
    if (!hiloId) {
      return NextResponse.json({ ok: false, error: 'ID de hilo inválido' }, { status: 400 });
    }

    const body = (await req.json()) as VoteBody;
    console.log('Cuerpo de la petición:', body);
    if (body.value !== -1 && body.value !== 0 && body.value !== 1) {
      return NextResponse.json({ ok: false, error: 'Valor de voto inválido' }, { status: 400 });
    }

    const userId = session.user.id;

    console.log('ID de usuario:', userId);
    console.log('ID de hilo:', hiloId);
    console.log('Acción:', body.value === 0 ? 'Eliminar voto' : body.value === 1 ? 'Upvote' : 'Downvote');
    
    if (body.value === 0) {
      // Eliminar el voto existente
      console.log('Eliminando voto existente');
      const { data: deleteData, error: deleteError } = await supabase
        .from('foro_votos_hilos')
        .delete()
        .eq('hilo_id', hiloId)
        .eq('usuario_id', userId);

      if (deleteError) {
        console.error('Error al eliminar voto:', deleteError);
        return NextResponse.json({ ok: false, error: 'Error al eliminar el voto' }, { status: 500 });
      }
    } else {
      // Insertar o actualizar el voto
      console.log('Insertando/actualizando voto con valor:', body.value);
      const { data: upsertData, error: upsertError } = await supabase
        .from('foro_votos_hilos')
        .upsert(
          { 
            hilo_id: hiloId, 
            usuario_id: userId, 
            valor: body.value
          },
          { 
            onConflict: 'hilo_id,usuario_id',
            ignoreDuplicates: false
          }
        )
        .select();

      console.log('Resultado del UPSERT:', { upsertData, upsertError });
      if (upsertError) {
        console.error('Error al actualizar voto:', upsertError);
        return NextResponse.json({ ok: false, error: 'Error al actualizar el voto' }, { status: 500 });
      }
    }

    // Obtener el nuevo estado de votos
    const { total, userVote } = await getVotesTotalFor(supabase, hiloId);

    return NextResponse.json({ 
      ok: true, 
      total, 
      userVote
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('Error en el servidor:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const hiloId = params.id;
    
    if (!hiloId) {
      return NextResponse.json({ ok: false, error: 'ID de hilo inválido' }, { status: 400 });
    }

    // Obtener el total de votos y el voto del usuario actual
    const { total, userVote } = await getVotesTotalFor(supabase, hiloId);

    return NextResponse.json({ 
      ok: true, 
      total, 
      userVote 
    });
  } catch (err) {
    console.error('Error en el endpoint GET de votos:', err);
    const message = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ 
      ok: false, 
      error: message 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Tipos estrictos para el body de la petición
interface VoteBody {
  value: -1 | 0 | 1; // -1: downvote, 0: quitar voto, 1: upvote
}

// Tipo para filas de votos con sólo el campo necesario (no dependemos de Database porque la tabla puede no estar en types)
type VotoRow = { valor_voto: number | null };

// Helper para obtener el total de votos del post/comentario
async function getVotesTotalFor(
  supabase: SupabaseClient<Database>, 
  postId: string
): Promise<{ total: number; userVote: -1 | 0 | 1 }> {
  // Obtener el voto del usuario actual si está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // Calcular el total de votos sumando todos los votos de la tabla foro_votos_posts
  const { data: votos, error: votosError } = await supabase
    .from('foro_votos_posts')
    .select('valor_voto')
    .eq('post_id', postId);
  
  if (votosError) {
    console.error('Error al obtener votos:', votosError);
    return { total: 0, userVote: 0 };
  }

  // Sumar todos los votos con tipado estricto
  const votosList: VotoRow[] = (votos ?? []) as VotoRow[];
  const total = votosList.reduce((sum: number, voto: VotoRow) => sum + (voto.valor_voto ?? 0), 0);

  // Si no hay usuario, devolvemos solo el total
  if (!userId) {
    return { 
      total, 
      userVote: 0 
    };
  }

  // Obtenemos el voto del usuario actual
  const { data: userVote } = await supabase
    .from('foro_votos_posts')
    .select('valor_voto')
    .eq('post_id', postId)
    .eq('usuario_id', userId)
    .single();

  const userVoteValue: -1 | 0 | 1 = (userVote && typeof (userVote as VotoRow).valor_voto === 'number'
    ? ((userVote as VotoRow).valor_voto as -1 | 0 | 1)
    : 0);

  return { 
    total, 
    userVote: userVoteValue 
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('[VOTOS POST] Iniciando POST /api/foro/comentario/[id]/votar');
  try {
    const supabase = await createClient();

    // Validar sesión
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[VOTOS POST] Usuario autenticado:', session?.user?.id);
    if (!session?.user?.id) {
      console.log('[VOTOS POST] ERROR: Usuario no autenticado');
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const postId = params.id;
    console.log('[VOTOS POST] Post ID:', postId);
    if (!postId) {
      return NextResponse.json({ ok: false, error: 'ID de post inválido' }, { status: 400 });
    }

    const body = (await req.json()) as VoteBody;
    console.log('[VOTOS POST] Cuerpo de la petición:', body);
    if (body.value !== -1 && body.value !== 0 && body.value !== 1) {
      console.log('[VOTOS POST] ERROR: Valor de voto inválido:', body.value);
      return NextResponse.json({ ok: false, error: 'Valor de voto inválido' }, { status: 400 });
    }

    const userId = session.user.id;

    console.log('[VOTOS POST] ID de usuario:', userId);
    console.log('[VOTOS POST] ID de post:', postId);
    console.log('[VOTOS POST] Acción:', body.value === 0 ? 'Eliminar voto' : body.value === 1 ? 'Upvote' : 'Downvote');
    
    if (body.value === 0) {
      // Eliminar el voto existente
      console.log('[VOTOS POST] Eliminando voto existente');
      const { data: deleteData, error: deleteError } = await supabase
        .from('foro_votos_posts')
        .delete()
        .eq('post_id', postId)
        .eq('usuario_id', userId)
        .select();

      console.log('[VOTOS POST] Resultado DELETE:', { deleteData, deleteError });
      if (deleteError) {
        console.error('[VOTOS POST] ERROR al eliminar voto:', deleteError);
        return NextResponse.json({ ok: false, error: 'Error al eliminar el voto' }, { status: 500 });
      }
    } else {
      // Insertar o actualizar el voto
      console.log('[VOTOS POST] Insertando/actualizando voto con valor:', body.value);
      const { data: upsertData, error: upsertError } = await supabase
        .from('foro_votos_posts')
        .upsert(
          { 
            post_id: postId, 
            usuario_id: userId, 
            valor_voto: body.value
          },
          { 
            onConflict: 'post_id,usuario_id',
            ignoreDuplicates: false
          }
        )
        .select();

      console.log('[VOTOS POST] Resultado UPSERT:', { upsertData, upsertError });
      if (upsertError) {
        console.error('[VOTOS POST] ERROR al actualizar voto:', upsertError);
        return NextResponse.json({ ok: false, error: 'Error al actualizar el voto' }, { status: 500 });
      }
    }

    // Obtener el nuevo estado de votos
    console.log('[VOTOS POST] Obteniendo total de votos...');
    const { total, userVote } = await getVotesTotalFor(supabase, postId);
    console.log('[VOTOS POST] Total de votos:', total, 'Voto del usuario:', userVote);

    return NextResponse.json({ 
      ok: true, 
      total, 
      userVote
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[VOTOS POST] ERROR en el servidor:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json({ ok: false, error: 'ID de post inválido' }, { status: 400 });
    }

    // Obtener el total de votos y el voto del usuario actual
    const { total, userVote } = await getVotesTotalFor(supabase, postId);

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

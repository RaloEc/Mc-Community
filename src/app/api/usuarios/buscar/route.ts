import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ usuarios: [] });
    }

    const supabase = await createClient();

    // Buscar usuarios por username
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, username, avatar_url, public_id, color, role, bio, followers_count')
      .ilike('username', `%${query}%`)
      .eq('activo', true)
      .limit(10);

    if (error) {
      console.error('Error buscando usuarios:', error);
      return NextResponse.json({ usuarios: [] });
    }

    // Obtener conteo de hilos para cada usuario
    const usuariosConHilos = await Promise.all(
      (data || []).map(async (usuario: any) => {
        const { count } = await supabase
          .from('foro_hilos')
          .select('*', { count: 'exact', head: true })
          .eq('autor_id', usuario.id)
          .is('deleted_at', null);

        return {
          ...usuario,
          hilos_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      usuarios: usuariosConHilos,
    });
  } catch (error) {
    console.error('Error en búsqueda de usuarios:', error);
    return NextResponse.json({ usuarios: [] }, { status: 500 });
  }
}

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const hiloId = params.id;

  // 1. Verificar la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado. Debes iniciar sesión para responder.' }, { status: 401 });
  }

  // 2. Obtener y validar el contenido de la respuesta
  const { contenido } = await request.json();
  if (!contenido || typeof contenido !== 'string' || contenido.trim().length === 0) {
    return NextResponse.json({ error: 'El contenido de la respuesta no puede estar vacío.' }, { status: 400 });
  }

  if (!hiloId) {
    return NextResponse.json({ error: 'ID de hilo no proporcionado.' }, { status: 400 });
  }

  try {
    // 3. Insertar el nuevo post en la base de datos
    const { data: nuevoPost, error } = await supabase
      .from('foro_posts')
      .insert({
        hilo_id: hiloId,
        autor_id: session.user.id,
        contenido: contenido.trim(),
      })
      .select(`
        id,
        created_at,
        contenido,
        autor:perfiles!left(username, avatar_url, role, color)
      `)
      .single();

    if (error) {
      console.error('Error al insertar el post:', error);
      return NextResponse.json({ error: 'No se pudo publicar la respuesta. Inténtalo de nuevo.' }, { status: 500 });
    }

    // 4. Devolver la respuesta recién creada
    return NextResponse.json(nuevoPost, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado al responder al hilo:', error);
    return NextResponse.json({ error: 'Error inesperado en el servidor.' }, { status: 500 });
  }
}

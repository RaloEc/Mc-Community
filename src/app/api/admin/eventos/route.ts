import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Verificar si es administrador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();
      
    if (!perfil || perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    
    // Obtener eventos
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true });
      
    if (error) {
      console.error('Error al obtener eventos:', error);
      return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
    }
    
    return NextResponse.json(eventos);
  } catch (error) {
    console.error('Error en la ruta de eventos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Verificar si es administrador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();
      
    if (!perfil || perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    
    // Obtener datos del evento
    const eventoData = await request.json();
    
    // Validar datos mínimos
    if (!eventoData.titulo || !eventoData.fecha || !eventoData.tipo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    
    // Preparar datos para inserción
    const nuevoEvento = {
      ...eventoData,
      creado_por: session.user.id,
      creado_en: new Date().toISOString(),
      publicado_en: eventoData.estado === 'publicado' ? new Date().toISOString() : null
    };
    
    // Insertar evento
    const { data, error } = await supabase
      .from('eventos')
      .insert(nuevoEvento)
      .select()
      .single();
      
    if (error) {
      console.error('Error al crear evento:', error);
      return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en la ruta de eventos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

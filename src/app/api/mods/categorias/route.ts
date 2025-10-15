import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categorias, error } = await supabase
      .from('categorias_mod')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener las categorías de mods:', error);
      return NextResponse.json(
        { error: 'Error al obtener las categorías de mods' },
        { status: 500 }
      );
    }

    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error inesperado al obtener las categorías de mods:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener las categorías de mods' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar si el usuario es administrador
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar si el usuario es administrador
    const { data: userData, error: userError } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const { nombre, descripcion } = await request.json();
    
    // Validar los datos
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es obligatorio' },
        { status: 400 }
      );
    }

    // Insertar la nueva categoría
    const { data: newCategory, error: insertError } = await supabase
      .from('categorias_mod')
      .insert({
        nombre,
        descripcion: descripcion || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear la categoría:', insertError);
      return NextResponse.json(
        { error: 'Error al crear la categoría' },
        { status: 500 }
      );
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error inesperado al crear la categoría:', error);
    return NextResponse.json(
      { error: 'Error inesperado al crear la categoría' },
      { status: 500 }
    );
  }
}

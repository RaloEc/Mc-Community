import { getServiceClient } from '@/utils/supabase-service';
import { NextResponse } from 'next/server';

// GET: Obtener todas las categorías
export async function GET() {
  try {
    const supabase = getServiceClient();

    // Incluir conteo de hilos relacionados por categoría
    const { data: categoriasRaw, error } = await supabase
      .from('foro_categorias')
      .select(`
        *,
        hilos:foro_hilos!foro_hilos_categoria_id_fkey(count)
      `)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Error interno del servidor al obtener las categorías.' }, { status: 500 });
    }

    // Mapear para exponer hilos_count y no retornar el arreglo interno
    const baseCategorias = (categoriasRaw || []).map((c: any) => ({
      ...c,
      hilos_count: Array.isArray(c?.hilos) && c.hilos.length > 0 && typeof c.hilos[0]?.count === 'number'
        ? c.hilos[0].count
        : 0,
    }))
    .map(({ hilos, ...rest }: any) => rest);

    // Construir agregados: para categorías padre (parent_id null), sumar hilos propios + de subcategorías directas
    const categorias = baseCategorias.map((cat: any) => {
      if (!cat.parent_id) {
        const sumaSub = baseCategorias
          .filter((c: any) => c.parent_id === cat.id)
          .reduce((acc: number, c: any) => acc + (typeof c.hilos_count === 'number' ? c.hilos_count : 0), 0)
        const propios = typeof cat.hilos_count === 'number' ? cat.hilos_count : 0
        return { ...cat, hilos_total: propios + sumaSub }
      }
      return { ...cat, hilos_total: cat.hilos_count }
    })

    return NextResponse.json(categorias);

  } catch (error) {
    console.error('Error en la API de categorías:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

// POST: Crear una nueva categoría
export async function POST(request: Request) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const { nombre, slug, descripcion, orden, icono, parent_id, nivel, color, es_activa } = body;

    if (!nombre || !slug) {
      return NextResponse.json({ error: 'El nombre y el slug son obligatorios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('foro_categorias')
      .insert([{ 
        nombre, 
        slug, 
        descripcion, 
        orden, 
        icono, 
        parent_id, 
        nivel, 
        color, 
        es_activa 
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'El slug ya existe. Por favor, elige uno único.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error interno del servidor al crear la categoría.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error en la API de categorías (POST):', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

// PUT: Actualizar una categoría existente
export async function PUT(request: Request) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'El ID de la categoría es obligatorio.' }, { status: 400 });
    }

    const { nombre, slug, descripcion, orden, icono, parent_id, nivel, color, es_activa } = body;

    if (!nombre || !slug) {
      return NextResponse.json({ error: 'El nombre y el slug son obligatorios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('foro_categorias')
      .update({ 
        nombre, 
        slug, 
        descripcion, 
        orden, 
        icono, 
        parent_id, 
        nivel, 
        color, 
        es_activa 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
       if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'El slug ya existe. Por favor, elige uno único.' }, { status: 409 });
      }
      if (error.code === 'PGRST204') { // No rows returned
        return NextResponse.json({ error: 'No se encontró la categoría para actualizar.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Error interno del servidor al actualizar la categoría.' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en la API de categorías (PUT):', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

// DELETE: Eliminar una categoría
export async function DELETE(request: Request) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID de la categoría es obligatorio.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('foro_categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      // Podríamos querer manejar el caso de que la categoría tenga hilos asociados (foreign key constraint)
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json({ error: 'No se puede eliminar la categoría porque tiene hilos asociados.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error interno del servidor al eliminar la categoría.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Categoría eliminada correctamente' }, { status: 200 });

  } catch (error) {
    console.error('Error en la API de categorías (DELETE):', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

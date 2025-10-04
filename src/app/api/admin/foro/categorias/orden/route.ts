import { getServiceClient } from '@/utils/supabase-service';
import { NextResponse } from 'next/server';

// PUT: Actualizar el orden de las categorías
export async function PUT(request: Request) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de actualizaciones.' }, { status: 400 });
    }

    // Actualizar cada categoría con su nuevo orden
    const promises = updates.map(({ id, orden }) =>
      supabase
        .from('foro_categorias')
        .update({ orden })
        .eq('id', id)
    );

    const results = await Promise.all(promises);

    // Verificar si hubo errores
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errores al actualizar orden:', errors);
      return NextResponse.json({ error: 'Error al actualizar el orden de algunas categorías.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Orden actualizado correctamente' }, { status: 200 });

  } catch (error) {
    console.error('Error en la API de orden de categorías:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

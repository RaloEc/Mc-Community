import { getServiceClient } from '@/utils/supabase-service';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const reordenarSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    orden: z.number().int().min(0),
  })),
});

async function esAdmin(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return perfil?.role === 'admin';
  } catch (error) {
    console.error('Error verificando rol de admin:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const clienteAuth = await createClient();
    const { data: { user }, error: authError } = await clienteAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // 2. Verificar que sea admin
    const admin = await esAdmin(clienteAuth);
    if (!admin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // 3. Validar el body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido. Debe ser JSON válido.' },
        { status: 400 }
      );
    }

    const validacion = reordenarSchema.safeParse(body);
    if (!validacion.success) {
      return NextResponse.json(
        {
          error: 'Datos de validación inválidos',
          detalles: validacion.error.errors.map(err => ({
            campo: err.path.join('.'),
            mensaje: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { updates } = validacion.data;

    // 4. Actualizar el orden de cada categoría
    const supabase = getServiceClient();
    
    const promises = updates.map(update =>
      supabase
        .from('foro_categorias')
        .update({ orden: update.orden })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);

    // Verificar si hubo errores
    const errores = results.filter(r => r.error);
    if (errores.length > 0) {
      console.error('Errores al reordenar categorías:', errores);
      return NextResponse.json(
        { error: 'Error al actualizar el orden de algunas categorías.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Orden actualizado correctamente',
      updated: updates.length 
    });

  } catch (error) {
    console.error('Error en la API de reordenar categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

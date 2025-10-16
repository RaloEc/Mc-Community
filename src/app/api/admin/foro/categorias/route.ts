import { getServiceClient } from '@/utils/supabase-service';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema de validación con Zod para crear/actualizar categorías
const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre no puede estar vacío').trim(),
  slug: z.string().min(1, 'El slug no puede estar vacío').trim(),
  descripcion: z.string().optional().default(''),
  orden: z.number().int().min(0).optional().default(0),
  icono: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  nivel: z.number().int().min(1).max(3).optional().default(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido').optional().default('#3b82f6'),
  es_activa: z.boolean().optional().default(true),
});

// Función para verificar si el usuario es administrador
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
    console.error('Error al verificar rol de administrador:', error);
    return false;
  }
}

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
    // 1. Verificar autenticación y autorización
    const clienteAuth = await createClient();
    const { data: { user }, error: authError } = await clienteAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // Verificar que sea administrador
    const admin = await esAdmin(clienteAuth);
    if (!admin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // 2. Leer y validar el cuerpo de la petición
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido. Debe ser JSON válido.' },
        { status: 400 }
      );
    }

    // 3. Validar con Zod
    const validacion = categoriaSchema.safeParse(body);
    
    if (!validacion.success) {
      const errores = validacion.error.errors.map(err => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Datos de validación inválidos',
          detalles: errores
        },
        { status: 400 }
      );
    }

    const datosValidados = validacion.data;

    // 4. Insertar en la base de datos
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('foro_categorias')
      .insert([datosValidados])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      
      // Manejar errores específicos de la base de datos
      if (error.code === '23505') { // unique_violation
        return NextResponse.json(
          { error: 'El slug ya existe. Por favor, elige uno único.' },
          { status: 409 }
        );
      }
      
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json(
          { error: 'La categoría padre especificada no existe.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error interno del servidor al crear la categoría.' },
        { status: 500 }
      );
    }

    // 5. Retornar respuesta exitosa con código 201
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error en la API de categorías (POST):', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una categoría existente
export async function PUT(request: Request) {
  try {
    // Verificar autenticación y autorización
    const clienteAuth = await createClient();
    const { data: { user }, error: authError } = await clienteAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    const admin = await esAdmin(clienteAuth);
    if (!admin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener ID de la URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la categoría es obligatorio.' },
        { status: 400 }
      );
    }

    // Leer y validar el cuerpo
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido. Debe ser JSON válido.' },
        { status: 400 }
      );
    }

    // Validar con Zod (parcial para permitir actualizaciones parciales)
    const validacion = categoriaSchema.partial().safeParse(body);
    
    if (!validacion.success) {
      const errores = validacion.error.errors.map(err => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Datos de validación inválidos',
          detalles: errores
        },
        { status: 400 }
      );
    }

    const datosValidados = validacion.data;

    // Actualizar en la base de datos
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('foro_categorias')
      .update(datosValidados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      
      if (error.code === '23505') { // unique_violation
        return NextResponse.json(
          { error: 'El slug ya existe. Por favor, elige uno único.' },
          { status: 409 }
        );
      }
      
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'No se encontró la categoría para actualizar.' },
          { status: 404 }
        );
      }
      
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json(
          { error: 'La categoría padre especificada no existe.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error interno del servidor al actualizar la categoría.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en la API de categorías (PUT):', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una categoría
export async function DELETE(request: Request) {
  try {
    // Verificar autenticación y autorización
    const clienteAuth = await createClient();
    const { data: { user }, error: authError } = await clienteAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    const admin = await esAdmin(clienteAuth);
    if (!admin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener ID de la URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la categoría es obligatorio.' },
        { status: 400 }
      );
    }

    // Eliminar de la base de datos
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('foro_categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json(
          { error: 'No se puede eliminar la categoría porque tiene hilos asociados.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error interno del servidor al eliminar la categoría.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Categoría eliminada correctamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en la API de categorías (DELETE):', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

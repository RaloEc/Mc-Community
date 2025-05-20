import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

// Esta API usa el cliente de servicio directamente, por lo que no necesita verificar permisos
// La verificación de permisos se hace en el cliente

// POST - Crear un nuevo mod usando el cliente de servicio
export async function POST(request: NextRequest) {
  try {
    // Usar directamente el cliente de servicio sin verificar autenticación
    // La verificación de permisos debe hacerse en el cliente
    
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.nombre || !body.descripcion || !body.version || !body.version_minecraft) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    
    // Al menos un enlace debe estar presente
    if (!body.enlace_curseforge && !body.enlace_modrinth && !body.enlace_directo && !body.enlace_otro) {
      return NextResponse.json({ error: 'Debe proporcionar al menos un enlace' }, { status: 400 });
    }
    
    // Crear mod utilizando el cliente de servicio
    const serviceClient = getServiceClient();
    
    const modData = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      version: body.version,
      version_minecraft: body.version_minecraft,
      enlace_curseforge: body.enlace_curseforge || null,
      enlace_modrinth: body.enlace_modrinth || null,
      enlace_directo: body.enlace_directo || null,
      enlace_otro: body.enlace_otro || null,
      imagen_url: body.imagen_url || null,
      autor: body.autor || 'Usuario',
      user_id: body.user_id, // Usar el ID del usuario enviado desde el cliente
      descargas: 0
    };
    
    const { data: mod, error: modError } = await serviceClient
      .from('mods')
      .insert([modData])
      .select()
      .single();
      
    if (modError) {
      console.error('Error al insertar mod:', modError);
      return NextResponse.json({ error: `Error al crear el mod: ${modError.message}` }, { status: 500 });
    }
    
    // Asociar categorías si existen
    if (body.categorias && body.categorias.length > 0) {
      const categoriasInserts = body.categorias.map((categoriaId: string) => ({
        mod_id: mod.id,
        categoria_id: categoriaId
      }));
      
      const { error: categoriasError } = await serviceClient
        .from('mods_categorias')
        .insert(categoriasInserts);
        
      if (categoriasError) {
        console.error('Error al insertar categorías:', categoriasError);
        // No fallamos la operación completa si hay error en las categorías
      }
    }
    
    return NextResponse.json({ mensaje: 'Mod creado correctamente', mod });
  } catch (error: any) {
    console.error('Error al crear mod:', error);
    return NextResponse.json({ error: `Error al crear el mod: ${error.message || 'Error desconocido'}` }, { status: 500 });
  }
}

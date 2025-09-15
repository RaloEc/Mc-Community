import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';


// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

// GET - Obtener todos los mods
export async function GET(request: NextRequest) {
  try {
    // Usar directamente el cliente de servicio para saltarse la autenticación
    const serviceClient = getServiceClient();
    
    // Obtener mods con información de autor
    const { data: mods, error: modsError } = await serviceClient
      .from('mods')
      .select('*')
      .order('fecha_creacion', { ascending: false });
      
    if (modsError) {
      throw modsError;
    }
    
    // Para cada mod, obtener sus categorías
    const modsConCategorias = await Promise.all(mods.map(async (mod) => {
      const { data: categoriasData, error: categoriasError } = await serviceClient
        .from('mods_categorias')
        .select('categoria_id, categorias:categorias_mod(id, nombre)')
        .eq('mod_id', mod.id);
        
      if (categoriasError) {
        console.error('Error al obtener categorías:', categoriasError);
        return { ...mod, categorias: [] };
      }
      
      return {
        ...mod,
        categorias: categoriasData?.map((cat) => cat.categorias) || []
      };
    }));
    
    return NextResponse.json(modsConCategorias);
  } catch (error) {
    console.error('Error al obtener mods:', error);
    return NextResponse.json({ error: 'Error al obtener mods' }, { status: 500 });
  }
}

// POST - Crear un nuevo mod
export async function POST(request: NextRequest) {
  try {
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
      user_id: body.user_id,
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

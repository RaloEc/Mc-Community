import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: mods, error } = await supabase
      .from('mods')
      .select('*')
      .order('date_modified_api', { ascending: false });

    if (error) {
      console.error('Error al obtener los mods:', error);
      return NextResponse.json(
        { error: 'Error al obtener los mods' },
        { status: 500 }
      );
    }

    // Transformar los datos para mantener compatibilidad con el código existente
    const transformedMods = mods?.map(mod => ({
      ...mod,
      // Campos de compatibilidad
      nombre: mod.name,
      descripcion: mod.summary || mod.description_html,
      version: mod.game_versions?.[0] || 'Desconocida',
      version_minecraft: mod.game_versions?.[0] || 'Desconocida',
      autor: mod.author_name,
      descargas: mod.total_downloads || 0,
      imagen_url: mod.logo_url,
      fecha_creacion: mod.date_created_api,
      ultima_actualizacion: mod.date_modified_api,
      
      // Determinar enlace principal y tipo
      enlace_principal: mod.website_url,
      tipo_enlace_principal: mod.source === 'curseforge' ? 'curseforge' : 
                           mod.source === 'modrinth' ? 'modrinth' : 
                           mod.source === 'github' ? 'github' : undefined,
      
      // Enlaces específicos
      enlace_curseforge: mod.source === 'curseforge' ? mod.website_url : undefined,
      enlace_modrinth: mod.source === 'modrinth' ? mod.website_url : undefined,
      enlace_github: mod.source === 'github' ? mod.website_url : undefined,
      
      // Categorías como objetos para compatibilidad
      categorias: mod.categories?.map(cat => ({ id: cat, nombre: cat })) || []
    }));

    return NextResponse.json(transformedMods);
  } catch (error) {
    console.error('Error inesperado al obtener los mods:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener los mods' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verificar si el usuario está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const modData = await request.json();
    
    // Validar los datos del formulario
    if (!modData.name || !modData.website_url || !modData.source || !modData.source_id) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (name, website_url, source, source_id)' },
        { status: 400 }
      );
    }

    // Preparar datos para la nueva estructura
    const newModData = {
      source: modData.source,
      source_id: modData.source_id,
      name: modData.name,
      slug: modData.slug || modData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      summary: modData.summary || modData.descripcion,
      description_html: modData.description_html || modData.descripcion,
      logo_url: modData.logo_url || modData.imagen_url,
      website_url: modData.website_url,
      total_downloads: modData.total_downloads || modData.descargas || 0,
      author_name: modData.author_name || modData.autor,
      categories: modData.categories || (modData.categoria_ids ? modData.categoria_ids : []),
      game_versions: modData.game_versions || [modData.version_minecraft],
      mod_loader: modData.mod_loader || [],
      date_created_api: modData.date_created_api || new Date().toISOString(),
      date_modified_api: modData.date_modified_api || new Date().toISOString(),
    };

    // Insertar el nuevo mod
    const { data: newMod, error: insertError } = await supabase
      .from('mods')
      .insert(newModData)
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear el mod:', insertError);
      return NextResponse.json(
        { error: 'Error al crear el mod' },
        { status: 500 }
      );
    }

    // Transformar el resultado para mantener compatibilidad con el código existente
    const transformedMod = {
      ...newMod,
      nombre: newMod.name,
      descripcion: newMod.summary || newMod.description_html,
      version: newMod.game_versions?.[0] || 'Desconocida',
      version_minecraft: newMod.game_versions?.[0] || 'Desconocida',
      autor: newMod.author_name,
      descargas: newMod.total_downloads || 0,
      imagen_url: newMod.logo_url,
      fecha_creacion: newMod.date_created_api,
      ultima_actualizacion: newMod.date_modified_api,
      enlace_principal: newMod.website_url,
      tipo_enlace_principal: newMod.source,
      categorias: newMod.categories?.map(cat => ({ id: cat, nombre: cat })) || []
    };

    return NextResponse.json(transformedMod, { status: 201 });
  } catch (error) {
    console.error('Error inesperado al crear el mod:', error);
    return NextResponse.json(
      { error: 'Error inesperado al crear el mod' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: mod, error } = await supabase
      .from('mods')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error al obtener el mod:', error);
      return NextResponse.json(
        { error: 'Mod no encontrado' },
        { status: 404 }
      );
    }

    // Transformar los datos para mantener compatibilidad con el código existente
    const transformedMod = {
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
    };

    return NextResponse.json(transformedMod);
  } catch (error) {
    console.error('Error inesperado al obtener el mod:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener el mod' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
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
    const updateModData = {
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
      date_modified_api: new Date().toISOString(),
    };

    // Actualizar el mod
    const { data: updatedMod, error: updateError } = await supabase
      .from('mods')
      .update(updateModData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar el mod:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el mod' },
        { status: 500 }
      );
    }

    // Transformar el resultado para mantener compatibilidad con el código existente
    const transformedMod = {
      ...updatedMod,
      nombre: updatedMod.name,
      descripcion: updatedMod.summary || updatedMod.description_html,
      version: updatedMod.game_versions?.[0] || 'Desconocida',
      version_minecraft: updatedMod.game_versions?.[0] || 'Desconocida',
      autor: updatedMod.author_name,
      descargas: updatedMod.total_downloads || 0,
      imagen_url: updatedMod.logo_url,
      fecha_creacion: updatedMod.date_created_api,
      ultima_actualizacion: updatedMod.date_modified_api,
      enlace_principal: updatedMod.website_url,
      tipo_enlace_principal: updatedMod.source,
      categorias: updatedMod.categories?.map(cat => ({ id: cat, nombre: cat })) || []
    };

    return NextResponse.json(transformedMod);
  } catch (error) {
    console.error('Error inesperado al actualizar el mod:', error);
    return NextResponse.json(
      { error: 'Error inesperado al actualizar el mod' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar si el usuario está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Eliminar el mod (las relaciones se eliminarán en cascada)
    const { error: deleteError } = await supabase
      .from('mods')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error al eliminar el mod:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el mod' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error inesperado al eliminar el mod:', error);
    return NextResponse.json(
      { error: 'Error inesperado al eliminar el mod' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Función para verificar si el usuario es administrador
async function isAdmin(userId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "admin";
}

// GET - Obtener un mod específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Verificar autenticación
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es administrador
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener mod
    const serviceClient = getServiceClient();
    const { data: mod, error: modError } = await serviceClient
      .from("mods")
      .select("*")
      .eq("id", id)
      .single();

    if (modError) {
      if (modError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Mod no encontrado" },
          { status: 404 }
        );
      }
      throw modError;
    }

    // Obtener categorías del mod
    const { data: categoriasData, error: categoriasError } = await serviceClient
      .from("mods_categorias")
      .select("categoria_id, categorias:categorias_mod(id, nombre)")
      .eq("mod_id", id);

    if (categoriasError) {
      throw categoriasError;
    }

    const modConCategorias = {
      ...mod,
      categorias: categoriasData?.map((cat) => cat.categorias) || [],
    };

    return NextResponse.json(modConCategorias);
  } catch (error) {
    console.error("Error al obtener mod:", error);
    return NextResponse.json(
      { error: "Error al obtener el mod" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un mod
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Verificar autenticación
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es administrador
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();

    // Validar campos requeridos
    if (!body.nombre || !body.descripcion || !body.version_minecraft) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Al menos un enlace debe estar presente
    if (
      !body.enlace_descarga &&
      !body.enlace_curseforge &&
      !body.enlace_modrinth
    ) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un enlace" },
        { status: 400 }
      );
    }

    // Verificar que el mod existe
    const serviceClient = getServiceClient();
    const { data: modExistente, error: modError } = await serviceClient
      .from("mods")
      .select("id")
      .eq("id", id)
      .single();

    if (modError) {
      if (modError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Mod no encontrado" },
          { status: 404 }
        );
      }
      throw modError;
    }

    // Actualizar mod
    const modData = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      version: body.version || null,
      version_minecraft: body.version_minecraft,
      enlace_descarga: body.enlace_descarga || null,
      enlace_curseforge: body.enlace_curseforge || null,
      enlace_modrinth: body.enlace_modrinth || null,
      tipo_enlace_principal: body.tipo_enlace_principal || "descarga",
      fecha_actualizacion: new Date().toISOString(),
    };

    // Actualizar imagen solo si se proporciona
    if (body.imagen_url !== undefined) {
      modData["imagen_url"] = body.imagen_url;
    }

    const { data: mod, error: updateError } = await serviceClient
      .from("mods")
      .update(modData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Actualizar categorías si se proporcionan
    if (body.categorias) {
      // Eliminar categorías existentes
      const { error: deleteError } = await serviceClient
        .from("mods_categorias")
        .delete()
        .eq("mod_id", id);

      if (deleteError) {
        throw deleteError;
      }

      // Insertar nuevas categorías
      if (body.categorias.length > 0) {
        const categoriasInserts = body.categorias.map(
          (categoriaId: string) => ({
            mod_id: id,
            categoria_id: categoriaId,
          })
        );

        const { error: insertError } = await serviceClient
          .from("mods_categorias")
          .insert(categoriasInserts);

        if (insertError) {
          throw insertError;
        }
      }
    }

    return NextResponse.json({ mensaje: "Mod actualizado correctamente", mod });
  } catch (error) {
    console.error("Error al actualizar mod:", error);
    return NextResponse.json(
      { error: "Error al actualizar el mod" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un mod
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Verificar autenticación
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es administrador
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const serviceClient = getServiceClient();

    // Primero, eliminar las relaciones en mods_categorias
    const { error: categoriasError } = await serviceClient
      .from("mods_categorias")
      .delete()
      .eq("mod_id", id);

    if (categoriasError) {
      throw categoriasError;
    }

    // Luego, eliminar el mod
    const { error: modError } = await serviceClient
      .from("mods")
      .delete()
      .eq("id", id);

    if (modError) {
      throw modError;
    }

    return NextResponse.json({ mensaje: "Mod eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar mod:", error);
    return NextResponse.json(
      { error: "Error al eliminar el mod" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Obtener todos los mensajes del ticker (público)
export const GET = async () => {
  try {
    const supabase = await createClient();

    // Primero obtenemos los mensajes del ticker
    const { data: tickerData, error: tickerError } = await supabase
      .from("news_ticker")
      .select("*")
      .order("orden", { ascending: true });

    if (tickerError) throw tickerError;

    // Obtenemos los IDs de noticias únicos para la consulta
    const noticiaIds = Array.from(
      new Set(
        tickerData
          .filter((item) => item.noticia_id)
          .map((item) => item.noticia_id)
          .filter((id): id is string => Boolean(id)) // Aseguramos que son strings
      )
    );

    // Obtenemos las noticias relacionadas en una sola consulta
    let noticiasMap = new Map();
    if (noticiaIds.length > 0) {
      const { data: noticiasData, error: noticiasError } = await supabase
        .from("noticias")
        .select("id, titulo, slug, created_at")
        .in("id", noticiaIds);

      if (noticiasError) {
        console.error("Error al obtener noticias relacionadas:", noticiasError);
      } else if (noticiasData) {
        // Creamos un mapa para búsqueda rápida
        noticiasMap = new Map(
          noticiasData.map((noticia) => [noticia.id, noticia])
        );
      }
    }

    // Combinamos los datos
    const formattedData = tickerData.map((item) => ({
      ...item,
      noticia: item.noticia_id
        ? noticiasMap.get(item.noticia_id) || null
        : null,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error al obtener mensajes del ticker:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
};

// Crear un nuevo mensaje en el ticker
export const POST = async (request: Request) => {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { mensaje, activo = true, orden } = await request.json();

    const { data, error } = await supabase
      .from("news_ticker")
      .insert([{ mensaje, activo, orden }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error al crear mensaje del ticker:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
};

// Actualizar múltiples mensajes del ticker
export const PUT = async (request: Request) => {
  const supabase = await createClient();

  try {
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Validar y formatear los datos
    const updates = await request.json();
    if (!Array.isArray(updates)) {
      return new NextResponse("Se esperaba un arreglo de actualizaciones", {
        status: 400,
      });
    }

    const formattedUpdates = updates
      .map((update) => ({
        id: update.id,
        mensaje: String(update.mensaje || "").trim(),
        activo: Boolean(update.activo),
        orden: Number(update.orden) || 0,
        actualizado_en: new Date().toISOString(),
      }))
      .filter((update) => update.mensaje !== ""); // Filtrar mensajes vacíos

    // Separar actualizaciones de registros existentes e inserciones de nuevos
    const updatesToProcess = formattedUpdates.filter(
      (update) => update.id && !update.id.startsWith("temp-")
    );
    const insertsToProcess = formattedUpdates.filter(
      (update) => !update.id || update.id.startsWith("temp-")
    );

    // 1. Obtener todos los IDs existentes para determinar cuáles eliminar
    const { data: existingMessages, error: fetchError } = await supabase
      .from("news_ticker")
      .select("id");

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingMessages.map((m) => m.id));
    const newIds = new Set(updatesToProcess.map((u) => u.id));
    const idsToDelete = Array.from(existingIds).filter((id) => !newIds.has(id));

    // 2. Eliminar registros que ya no están en la lista
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("news_ticker")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }

    // 3. Actualizar registros existentes
    const updatePromises = updatesToProcess.map(async (update) => {
      const { id, ...updateData } = update;
      const { error: updateError } = await supabase
        .from("news_ticker")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;
      return { ...updateData, id };
    });

    // 4. Insertar nuevos registros
    const insertPromises = insertsToProcess.map(async (insert) => {
      const { id: _, ...insertData } = insert;
      const { data: newRecord, error: insertError } = await supabase
        .from("news_ticker")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      return newRecord;
    });

    // Ejecutar todas las operaciones en paralelo
    await Promise.all([...updatePromises, ...insertPromises]);

    // Obtener los datos actualizados
    const { data: allData, error: fetchAllError } = await supabase
      .from("news_ticker")
      .select("*")
      .order("orden", { ascending: true });

    if (fetchAllError) throw fetchAllError;

    return NextResponse.json(allData);
  } catch (error) {
    console.error("Error al actualizar mensajes del ticker:", error);

    // Proporcionar más detalles del error
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    const errorDetails = error instanceof Error ? error.stack : String(error);

    console.error("Detalles del error:", errorDetails);

    return new NextResponse(
      JSON.stringify({
        error: "Error interno del servidor",
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

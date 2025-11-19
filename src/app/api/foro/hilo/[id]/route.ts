import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const hiloId = params.id;

  if (!hiloId) {
    return NextResponse.json(
      { error: "ID de hilo no proporcionado" },
      { status: 400 }
    );
  }

  try {
    // Incrementar el contador de vistas. Si la función no existe, no se detiene la ejecución.
    try {
      await supabase.rpc("incrementar_vista_hilo", { hilo_id: hiloId });
    } catch (rpcError) {
      console.warn(
        "No se pudo incrementar las vistas del hilo (la función RPC puede no existir):",
        rpcError
      );
    }

    // Obtener los datos del hilo, incluyendo la información del autor y la categoría
    const { data: hilo, error } = await supabase
      .from("foro_hilos")
      .select(
        `
        *,
        categoria:foro_categorias(nombre, slug),
        autor:perfiles!left(username, avatar_url, role, color),
        weapon_stats_record:weapon_stats_records!left(id, weapon_name, stats)
      `
      )
      .eq("id", hiloId)
      .single();

    if (error) {
      console.error("Error al obtener el hilo:", error);
      return NextResponse.json(
        { error: "Error al cargar el hilo: " + error.message },
        { status: 500 }
      );
    }

    if (!hilo) {
      return NextResponse.json(
        { error: "Hilo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(hilo);
  } catch (error: any) {
    console.error("Error inesperado en la ruta del hilo:", error);
    return NextResponse.json(
      { error: "Error inesperado en el servidor: " + error.message },
      { status: 500 }
    );
  }
}

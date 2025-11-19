import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAuthedClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : undefined;

  return createSupabaseClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = getAuthedClient(request);
    const { searchParams } = new URL(request.url);

    const estado = searchParams.get("estado");
    const tipo_contenido = searchParams.get("tipo_contenido");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error } = await supabase.rpc("obtener_reportes_noticias", {
      p_estado: estado,
      p_tipo_contenido: tipo_contenido,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Error obteniendo reportes de noticias:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reportes: data });
  } catch (error) {
    console.error("Error en GET /api/admin/noticias/reportes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAuthedClient(request);

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log(
      "[POST /api/admin/noticias/reportes] Verificación de autenticación:",
      {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message,
      }
    );

    if (authError || !user) {
      console.error(
        "[POST /api/admin/noticias/reportes] Error de autenticación:",
        authError
      );
      return NextResponse.json(
        {
          error: "No autorizado. Debes iniciar sesión para reportar contenido.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tipo_contenido, contenido_id, razon, descripcion } = body;

    if (!tipo_contenido || !contenido_id || !razon) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el contenido exista
    let tablaContenido = "";
    switch (tipo_contenido) {
      case "noticia":
        tablaContenido = "noticias";
        break;
      case "comentario":
        tablaContenido = "comentarios";
        break;
      default:
        return NextResponse.json(
          { error: "Tipo de contenido no válido" },
          { status: 400 }
        );
    }

    const { data: contenido, error: contenidoError } = await supabase
      .from(tablaContenido)
      .select("id")
      .eq("id", contenido_id)
      .single();

    console.log(
      "[POST /api/admin/noticias/reportes] Validación de contenido:",
      {
        tipo_contenido,
        tablaContenido,
        contenido_id,
        contenidoError: contenidoError?.message,
        contenidoEncontrado: !!contenido,
      }
    );

    if (contenidoError || !contenido) {
      console.error(
        "[POST /api/admin/noticias/reportes] Contenido no encontrado:",
        contenidoError
      );
      return NextResponse.json(
        { error: "El contenido no existe" },
        { status: 404 }
      );
    }

    // Crear el reporte usando la función RPC
    const { data: reporteId, error: reporteError } = await supabase.rpc(
      "crear_reporte_noticia",
      {
        p_tipo_contenido: tipo_contenido,
        p_contenido_id: contenido_id,
        p_razon: razon,
        p_descripcion: descripcion || null,
      }
    );

    if (reporteError) {
      console.error("Error creando reporte de noticia:", reporteError);
      return NextResponse.json(
        { error: "Error al crear el reporte" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reporte_id: reporteId }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/admin/noticias/reportes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getAuthedClient(request);
    const body = await request.json();

    const { reporte_id, accion, resolucion } = body;

    if (!reporte_id || !accion || !resolucion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    let rpcFunction = "";
    if (accion === "resolver") {
      rpcFunction = "resolver_reporte_noticia";
    } else if (accion === "desestimar") {
      rpcFunction = "desestimar_reporte_noticia";
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    const payload = {
      p_reporte_id: reporte_id,
      p_resolucion: resolucion,
    };

    const { data, error } = await supabase.rpc(rpcFunction, payload);

    if (error) {
      console.error("Error actualizando reporte de noticia:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: data });
  } catch (error) {
    console.error("Error en PATCH /api/admin/noticias/reportes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

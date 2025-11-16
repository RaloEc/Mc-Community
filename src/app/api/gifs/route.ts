import { NextResponse } from "next/server";

const TENOR_API_KEY = process.env.TENOR_API_KEY;
// Usamos el endpoint correcto de Google Cloud v2
const TENOR_BASE_URL = "https://tenor.googleapis.com/v2";

export async function GET(request: Request) {
  // LOG 1: Verificar si TENOR_API_KEY está cargada
  console.log("[API GIFs] ========== INICIO DE SOLICITUD ==========");
  console.log("[API GIFs] TENOR_API_KEY cargada:", !!TENOR_API_KEY);
  console.log(
    "[API GIFs] TENOR_API_KEY valor (primeros 10 chars):",
    TENOR_API_KEY?.substring(0, 20) + "..." || "UNDEFINED"
  );

  if (!TENOR_API_KEY) {
    console.error("[API GIFs] ERROR: TENOR_API_KEY no está configurada");
    console.error(
      "[API GIFs] Solución: Verifica que .env.local contiene TENOR_API_KEY=tu_api_key"
    );
    console.error(
      "[API GIFs] Luego reinicia el servidor: Ctrl+C y npm run dev"
    );
    return NextResponse.json(
      { error: "Tenor API key not configured. Check server logs." },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q"); // Parámetro de búsqueda
    const limit = searchParams.get("limit") || "20";

    // LOG 2: Parámetros de la solicitud
    console.log("[API GIFs] Parámetros:", { q, limit });

    let endpoint = "posts";
    // Google Cloud v2 requiere: key, client_key, limit, media_filter
    let params = `key=${TENOR_API_KEY}&client_key=mc_community&limit=${limit}&media_filter=gif`;

    // Si hay un parámetro 'q' (búsqueda), usa el endpoint de búsqueda
    if (q) {
      endpoint = "search";
      params += `&q=${encodeURIComponent(q)}`;
      console.log(`[API GIFs] Buscando: "${q}"`);
    } else {
      console.log("[API GIFs] Obteniendo GIFs trending");
    }

    const tenorApiUrl = `${TENOR_BASE_URL}/${endpoint}?${params}`;

    // LOG 3: URL construida (sin mostrar la key completa por seguridad)
    const urlSafeLog = tenorApiUrl.replace(
      TENOR_API_KEY,
      "TENOR_API_KEY_HIDDEN"
    );
    console.log("[API GIFs] URL de Tenor:", urlSafeLog);

    // LOG 4: Iniciando fetch
    console.log("[API GIFs] Llamando a Tenor API...");

    const apiResponse = await fetch(tenorApiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Revalidar caché de Next.js cada hora
      next: { revalidate: 3600 },
    });

    // LOG 5: Respuesta de Tenor
    console.log("[API GIFs] Respuesta de Tenor:", {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      ok: apiResponse.ok,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        `[API GIFs] Error de Tenor: ${apiResponse.status} ${apiResponse.statusText}`
      );
      console.error("[API GIFs] Respuesta de error:", errorText);
      return NextResponse.json(
        { error: `Failed to fetch from Tenor: ${apiResponse.statusText}` },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();

    // LOG 6: Estructura de respuesta completa para depuración
    console.log("[API GIFs] Estructura completa de la respuesta:");
    console.log(JSON.stringify(data, null, 2));
    console.log(
      `[API GIFs] Éxito: ${data.results?.length || 0} GIFs obtenidos`
    );
    console.log("[API GIFs] ========== FIN DE SOLICITUD ==========");

    return NextResponse.json(data);
  } catch (error) {
    // LOG 7: Error no capturado
    console.error("[API GIFs] Error interno:", error);
    console.error(
      "[API GIFs] Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.log(
      "[API GIFs] ========== FIN DE SOLICITUD (CON ERROR) =========="
    );
    return NextResponse.json(
      { error: "Internal server error. Check server logs." },
      { status: 500 }
    );
  }
}

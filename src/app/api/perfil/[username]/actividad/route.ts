import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ActivityResponse {
  hilos: Array<{
    id: string;
    titulo: string;
    created_at: string;
    categoria_titulo: string;
  }>;
  posts: Array<{
    id: string;
    contenido: string;
    created_at: string;
    hilo_id: string;
    hilo_titulo: string;
  }>;
  partidas: Array<{
    id: string;
    matchId: string;
    championName: string;
    role: string;
    kda: number;
    result: "win" | "loss";
    created_at: string;
  }>;
  stats: {
    hilos: number;
    posts: number;
    partidas: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = await createClient();
  const publicId = params.username;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "5");
  const offset = (page - 1) * limit;

  try {
    // Obtener usuario actual (si está autenticado)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // 1. Obtener el ID del usuario por public_id o username como fallback
    let { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("id")
      .eq("public_id", publicId)
      .single();

    // Si no encontramos por public_id, intentar por username
    if (perfilError || !perfil) {
      console.log(
        `[Perfil Actividad API] public_id "${publicId}" no encontrado, intentando por username...`
      );
      const { data: perfilPorUsername, error: errorUsername } = await supabase
        .from("perfiles")
        .select("id")
        .eq("username", publicId)
        .single();

      if (errorUsername || !perfilPorUsername) {
        console.error(
          "Error fetching profile for activity by public_id or username:",
          perfilError,
          errorUsername
        );
        return NextResponse.json(
          { error: "Perfil no encontrado" },
          { status: 404 }
        );
      }

      perfil = perfilPorUsername;
    }

    // Obtener actividades ocultas por el usuario actual (si está autenticado)
    let hiddenActivities: Set<string> = new Set();
    if (currentUser) {
      const { data: hidden } = await supabase
        .from("activity_visibility")
        .select("activity_type, activity_id")
        .eq("user_id", currentUser.id);

      if (hidden) {
        hiddenActivities = new Set(
          hidden.map((h) => `${h.activity_type}:${h.activity_id}`)
        );
      }
    }

    // 2. Obtener estadísticas de actividad (solo contenido no eliminado)
    const { count: hilosCount, error: hilosCountError } = await supabase
      .from("foro_hilos")
      .select("*", { count: "exact", head: true })
      .eq("autor_id", perfil.id)
      .is("deleted_at", null);

    const { count: postsCount, error: postsCountError } = await supabase
      .from("foro_posts")
      .select("*", { count: "exact", head: true })
      .eq("autor_id", perfil.id)
      .is("deleted_at", null);

    if (hilosCountError || postsCountError) {
      console.error("Error fetching stats:", hilosCountError, postsCountError);
    }

    // 3. Obtener últimos hilos creados con paginación
    const { data: ultimosHilos, error: hilosError } = await supabase
      .from("foro_hilos")
      .select(
        "id, titulo, created_at, categoria_id, foro_categorias!inner(titulo)"
      )
      .eq("autor_id", perfil.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (hilosError) {
      console.error("Error fetching threads:", hilosError);
    }

    // Mapear hilos con categoría y filtrar ocultos
    const hilosMapeados: ActivityResponse["hilos"] = (ultimosHilos || [])
      .filter((hilo: any) => !hiddenActivities.has(`forum_thread:${hilo.id}`))
      .map((hilo: any) => ({
        id: hilo.id,
        titulo: hilo.titulo,
        created_at: hilo.created_at,
        categoria_titulo: hilo.foro_categorias?.[0]?.titulo ?? "Sin categoría",
      }));

    // 4. Obtener últimos posts (respuestas) con paginación
    const { data: ultimosPosts, error: postsError } = await supabase
      .from("foro_posts")
      .select(
        "id, contenido, created_at, hilo_id, foro_hilos!inner(titulo, deleted_at)"
      )
      .eq("autor_id", perfil.id)
      .is("deleted_at", null)
      .is("foro_hilos.deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const limpiarHTML = (html: string): string => {
      if (!html) return "";
      return html.replace(/<[^>]*>/g, "").substring(0, 100) + "...";
    };

    let postsLimpios: ActivityResponse["posts"] = [];
    if (postsError) {
      console.error("Error fetching posts:", postsError);
    } else if (ultimosPosts) {
      postsLimpios = ultimosPosts
        .filter((post: any) => !hiddenActivities.has(`forum_post:${post.id}`))
        .map((post: any) => {
          const hilo = Array.isArray(post.foro_hilos)
            ? post.foro_hilos[0]
            : post.foro_hilos;
          return {
            id: post.id,
            contenido: limpiarHTML(post.contenido),
            created_at: post.created_at,
            hilo_id: post.hilo_id,
            hilo_titulo: hilo?.titulo ?? "Hilo desconocido",
          };
        });
    }

    // 5. Obtener partidas compartidas con paginación
    const { data: partidasCompartidas, error: partidasError } = await supabase
      .from("user_activity_entries")
      .select("id, match_id, metadata, created_at")
      .eq("user_id", perfil.id)
      .eq("type", "lol_match")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (partidasError) {
      console.error("Error fetching shared matches:", partidasError);
    }

    // Mapear partidas compartidas y filtrar ocultas
    let partidasMapeadas: ActivityResponse["partidas"] = [];
    if (partidasCompartidas) {
      partidasMapeadas = partidasCompartidas
        .filter(
          (entry: any) => !hiddenActivities.has(`lol_match:${entry.match_id}`)
        )
        .map((entry: any) => {
          const metadata = entry.metadata || {};
          // Determinar resultado basado en si el equipo ganó (simplificado)
          // En una implementación real, esto vendría del metadata o de match_participants
          const result = metadata.win ? "win" : "loss";

          return {
            id: entry.id,
            matchId: entry.match_id,
            championName: metadata.championName || "Desconocido",
            role: metadata.role || "Unknown",
            kda: metadata.kda || 0,
            result,
            created_at: entry.created_at,
          };
        });
    }

    // 6. Obtener conteo de partidas compartidas
    const { count: partidasCount, error: partidasCountError } = await supabase
      .from("user_activity_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", perfil.id)
      .eq("type", "lol_match")
      .is("deleted_at", null);

    if (partidasCountError) {
      console.error("Error fetching shared matches count:", partidasCountError);
    }

    const response: ActivityResponse = {
      hilos: hilosMapeados,
      posts: postsLimpios,
      partidas: partidasMapeadas,
      stats: {
        hilos: hilosCount ?? 0,
        posts: postsCount ?? 0,
        partidas: partidasCount ?? 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error fetching activity:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

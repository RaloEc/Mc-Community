import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// ============================================================================
// TIPOS
// ============================================================================

interface ActivityItem {
  id: string;
  type:
    | "noticia"
    | "comentario"
    | "hilo"
    | "respuesta"
    | "weapon"
    | "lol_match";
  title: string;
  preview?: string;
  timestamp: string;
  category: string;
  [key: string]: any;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getContentPreview(content: string, maxLength: number = 150): string {
  if (!content) return "";
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + "..."
    : plainText;
}

function parseConnectedAccounts(raw: any): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier");
    const userId = searchParams.get("userId");

    const cookieStore = cookies();
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUserId = userId || session.user.id;

    // ========================================================================
    // TIER 1: DATOS ESTÁTICOS (cacheable 30min)
    // ========================================================================
    if (tier === "static") {
      // Usar service client para Riot account (bypassar RLS)
      const { getServiceClient } = await import("@/lib/supabase/server");
      const serviceClient = getServiceClient();

      const [perfilResult, riotAccountResult] = await Promise.all([
        supabase.from("perfiles").select("*").eq("id", currentUserId).single(),
        // Usar service client para evitar problemas de RLS
        serviceClient
          .from("linked_accounts_riot")
          .select("*")
          .eq("user_id", currentUserId)
          .maybeSingle(),
      ]);

      if (perfilResult.error) {
        console.error(
          "[Initial Data API] Error fetching perfil:",
          perfilResult.error
        );
      }

      const perfil = perfilResult.data;
      const riotAccount = riotAccountResult.data;

      // DEBUG: Log para diagnosticar problema de cuenta Riot no encontrada
      console.log("[Initial Data API] Riot Account Query Debug:", {
        currentUserId,
        sessionUserId: session.user.id,
        riotAccountFound: !!riotAccount,
        riotAccountError: riotAccountResult.error,
        riotAccountData: riotAccount,
      });

      // Construir perfil completo
      const userMetadata = session.user.user_metadata || {};
      const rawRole = perfil?.role || userMetadata.role || "user";
      const validRole = ["user", "admin", "moderator"].includes(rawRole)
        ? rawRole
        : "user";

      const perfilCompleto = {
        id: currentUserId,
        username:
          perfil?.username ||
          userMetadata.full_name ||
          userMetadata.name ||
          "Usuario",
        role: validRole,
        email: session.user.email || "",
        avatar_url:
          perfil?.avatar_url ||
          userMetadata.avatar_url ||
          userMetadata.picture ||
          "/images/default-avatar.png",
        banner_url: perfil?.banner_url ?? null,
        color: perfil?.color || "#3b82f6",
        bio: perfil?.bio || "",
        ubicacion: perfil?.ubicacion || "",
        sitio_web: perfil?.sitio_web || "",
        connected_accounts: parseConnectedAccounts(perfil?.connected_accounts),
        activo: perfil?.activo ?? true,
        ultimo_acceso: perfil?.ultimo_acceso || new Date().toISOString(),
        created_at:
          perfil?.created_at ||
          session.user.created_at ||
          new Date().toISOString(),
        updated_at: perfil?.updated_at || new Date().toISOString(),
        followers_count: perfil?.followers_count ?? 0,
        following_count: perfil?.following_count ?? 0,
        friends_count: perfil?.friends_count ?? 0,
      };

      return NextResponse.json(
        {
          perfil: perfilCompleto,
          riotAccount: riotAccount,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=1800", // 30 minutos
          },
        }
      );
    }

    // ========================================================================
    // TIER 2: DATOS DINÁMICOS (siempre frescos)
    // ========================================================================
    if (tier === "dynamic") {
      const limit = 10;

      // Obtener estadísticas, actividades y items ocultos en paralelo
      const [
        noticiasCount,
        comentariosCount,
        hilosCount,
        respuestasCount,
        noticias,
        comentarios,
        hilos,
        respuestas,
        partidas,
        hiddenItems,
      ] = await Promise.all([
        // Conteos para estadísticas
        supabase
          .from("noticias")
          .select("id", { count: "exact", head: true })
          .eq("autor_id", currentUserId),
        supabase
          .from("comentarios")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", currentUserId),
        supabase
          .from("foro_hilos")
          .select("id", { count: "exact", head: true })
          .eq("autor_id", currentUserId)
          .is("deleted_at", null),
        supabase
          .from("foro_posts")
          .select("id", { count: "exact", head: true })
          .eq("autor_id", currentUserId),

        // Actividades recientes
        supabase
          .from("noticias")
          .select(
            "id, titulo, contenido, created_at, categorias:noticias_categorias(categoria:categorias(nombre))"
          )
          .eq("autor_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("comentarios")
          .select("id, contenido, created_at, noticia:noticias(titulo)")
          .eq("usuario_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("foro_hilos")
          .select(
            "id, titulo, contenido, created_at, categoria:foro_categorias(nombre)"
          )
          .eq("autor_id", currentUserId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("foro_posts")
          .select("id, contenido, created_at, gif_url, hilo:foro_hilos(titulo)")
          .eq("autor_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("user_activity_entries")
          .select("id, match_id, metadata, created_at")
          .eq("user_id", currentUserId)
          .eq("type", "lol_match")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("hidden_activity")
          .select("activity_type, activity_id")
          .eq("user_id", currentUserId),
      ]);

      // Estadísticas
      const estadisticas = {
        noticias: noticiasCount.count || 0,
        comentarios: comentariosCount.count || 0,
        hilos: hilosCount.count || 0,
        respuestas: respuestasCount.count || 0,
      };

      // Transformar actividades
      const actividadesNoticias: ActivityItem[] = (noticias.data || []).map(
        (n: any) => ({
          id: `noticia-${n.id}`,
          type: "noticia" as const,
          title: n.titulo,
          preview: getContentPreview(n.contenido || ""),
          timestamp: n.created_at,
          category: n.categorias?.[0]?.categoria?.nombre || "Noticias",
        })
      );

      const actividadesComentarios: ActivityItem[] = (
        comentarios.data || []
      ).map((c: any) => ({
        id: `comentario-${c.id}`,
        type: "comentario" as const,
        title: `Comentario en "${c.noticia?.titulo || "una noticia"}"`,
        preview: getContentPreview(c.contenido),
        timestamp: c.created_at,
        category: "Comentarios",
      }));

      const actividadesHilos: ActivityItem[] = (hilos.data || []).map(
        (h: any) => ({
          id: `hilo-${h.id}`,
          type: "hilo" as const,
          title: h.titulo,
          preview: getContentPreview(h.contenido || ""),
          content: h.contenido || "",
          timestamp: h.created_at,
          category: h.categoria?.nombre || "Foro",
        })
      );

      const actividadesRespuestas: ActivityItem[] = (respuestas.data || []).map(
        (r: any) => ({
          id: `respuesta-${r.id}`,
          type: "respuesta" as const,
          title: `Respuesta en "${r.hilo?.titulo || "un hilo"}"`,
          preview: getContentPreview(r.contenido),
          timestamp: r.created_at,
          gifUrl: r.gif_url || undefined,
          category: "Foro",
        })
      );

      // Procesar partidas (simplificado - metadata ya contiene la info necesaria)
      const actividadesPartidas: ActivityItem[] = (partidas.data || []).map(
        (p: any) => {
          const metadata =
            typeof p.metadata === "string"
              ? JSON.parse(p.metadata)
              : p.metadata || {};
          return {
            id: `lol_match-${p.id}`,
            type: "lol_match" as const,
            title: `Partida con ${metadata.championName || "Campeón"}`,
            preview: metadata.win
              ? "Victoria en League of Legends"
              : "Derrota en League of Legends",
            timestamp: p.created_at,
            category: "League of Legends",
            matchId: p.match_id,
            ...metadata,
          };
        }
      );

      // Combinar y ordenar actividades
      const todasActividades = [
        ...actividadesNoticias,
        ...actividadesComentarios,
        ...actividadesHilos,
        ...actividadesRespuestas,
        ...actividadesPartidas,
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);

      // Procesar items ocultos
      const hiddenSet: string[] = [];
      (hiddenItems.data || []).forEach((item: any) => {
        if (item.activity_type === "forum_thread") {
          hiddenSet.push(`hilo-${item.activity_id}`);
        } else if (item.activity_type === "forum_post") {
          hiddenSet.push(`respuesta-${item.activity_id}`);
          hiddenSet.push(`comentario-${item.activity_id}`);
        } else if (item.activity_type === "noticia") {
          hiddenSet.push(`noticia-${item.activity_id}`);
        } else if (item.activity_type === "lol_match") {
          hiddenSet.push(`lol_match-${item.activity_id}`);
          hiddenSet.push(`match-${item.activity_id}`);
        }
      });

      return NextResponse.json({
        estadisticas,
        actividades: todasActividades,
        hiddenItems: hiddenSet,
      });
    }

    // Tier no especificado o inválido
    return NextResponse.json(
      { error: "Parámetro 'tier' requerido (static|dynamic)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Initial Data API] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de paginación
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const userId = searchParams.get("userId");

    // Validar parámetros
    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID de usuario" },
        { status: 400 }
      );
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Crear cliente de Supabase
    const cookieStore = cookies();
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener actividades del usuario
    const [noticias, comentarios, hilos, respuestas, partidas] =
      await Promise.all([
        // Noticias creadas por el usuario
        supabase
          .from("noticias")
          .select(
            `
          id, titulo, contenido, created_at, 
          categorias:noticias_categorias(categoria:categorias(nombre))
        `
          )
          .eq("autor_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1),

        // Comentarios realizados por el usuario
        supabase
          .from("comentarios")
          .select(
            `
          id, contenido, created_at, 
          noticia:noticias(titulo)
        `
          )
          .eq("usuario_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1),

        // Hilos creados por el usuario
        supabase
          .from("foro_hilos")
          .select(
            `
          id, titulo, contenido, created_at, 
          categoria:foro_categorias(nombre)
        `
          )
          .eq("autor_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1),

        // Respuestas en hilos
        supabase
          .from("foro_posts")
          .select(
            `
          id, contenido, created_at, gif_url,
          hilo:foro_hilos(titulo)
        `
          )
          .eq("autor_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1),

        // Partidas compartidas
        supabase
          .from("user_activity_entries")
          .select("id, match_id, metadata, created_at")
          .eq("user_id", userId)
          .eq("type", "lol_match")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1),
      ]);

    // Función auxiliar para extraer preview de contenido
    const getContentPreview = (
      content: string,
      maxLength: number = 150
    ): string => {
      if (!content) return "";
      // Remover HTML tags
      const plainText = content.replace(/<[^>]*>/g, "");
      // Limitar longitud
      return plainText.length > maxLength
        ? plainText.substring(0, maxLength) + "..."
        : plainText;
    };

    // Definir tipos para las respuestas de Supabase
    type NoticiaItem = {
      id: number;
      titulo: string;
      contenido?: string;
      created_at: string;
      categorias?: Array<{ categoria?: { nombre?: string } }> | null;
    };

    type ComentarioItem = {
      id: number;
      contenido: string;
      created_at: string;
      noticia?: { titulo?: string } | null;
    };

    type HiloItem = {
      id: number;
      titulo: string;
      contenido?: string;
      created_at: string;
      categoria?: { nombre?: string } | null;
    };

    type RespuestaItem = {
      id: number;
      contenido: string;
      created_at: string;
      gif_url?: string | null;
      hilo?: { titulo?: string } | null;
    };

    type PartidaItem = {
      id: string;
      match_id: string;
      metadata: any;
      created_at: string;
    };

    const parseMetadata = (raw: any): Record<string, any> => {
      if (!raw) return {};
      if (typeof raw === "object") return raw;
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch (error) {
          console.warn("[Perfil Actividades API] No se pudo parsear metadata", {
            raw,
            error,
          });
          return {};
        }
      }
      return {};
    };

    // Transformar los resultados a formato ActivityItem
    const actividadesNoticias = ((noticias.data as NoticiaItem[]) || []).map(
      (noticia) => {
        // Asegurar que categorias es un array y acceder al primer elemento si existe
        const primeraCategoria =
          Array.isArray(noticia.categorias) && noticia.categorias.length > 0
            ? noticia.categorias[0]?.categoria?.nombre
            : "Noticias";

        return {
          id: `noticia-${noticia.id}`,
          type: "noticia",
          title: noticia.titulo,
          preview: getContentPreview(noticia.contenido || ""),
          timestamp: noticia.created_at,
          category: primeraCategoria,
        };
      }
    );

    const actividadesComentarios = (
      (comentarios.data as ComentarioItem[]) || []
    ).map((comentario) => ({
      id: `comentario-${comentario.id}`,
      type: "comentario",
      title: `Comentario en "${comentario.noticia?.titulo || "una noticia"}"`,
      preview: getContentPreview(comentario.contenido),
      timestamp: comentario.created_at,
      category: "Comentarios",
    }));

    const actividadesHilos = ((hilos.data as HiloItem[]) || []).map((hilo) => ({
      id: `hilo-${hilo.id}`,
      type: "hilo",
      title: hilo.titulo,
      preview: getContentPreview(hilo.contenido || ""),
      content: hilo.contenido || "",
      timestamp: hilo.created_at,
      category: hilo.categoria?.nombre || "Foro",
    }));

    const actividadesRespuestas = (
      (respuestas.data as RespuestaItem[]) || []
    ).map((respuesta) => ({
      id: `respuesta-${respuesta.id}`,
      type: "respuesta" as const,
      title: `Respuesta en "${respuesta.hilo?.titulo || "un hilo"}"`,
      preview: getContentPreview(respuesta.contenido),
      timestamp: respuesta.created_at,
      gifUrl: respuesta.gif_url || undefined,
      category: "Foro",
    }));

    const partidasData = (partidas.data as PartidaItem[]) || [];
    const matchIds = partidasData.map((partida) => partida.match_id);
    const uniqueMatchIds = Array.from(new Set(matchIds));

    let userPuuid: string | null = null;
    const { data: linkedAccount, error: linkedAccountError } = await supabase
      .from("linked_accounts_riot")
      .select("puuid")
      .eq("user_id", userId)
      .maybeSingle();

    if (linkedAccountError) {
      console.warn("[Perfil Actividades API] No se pudo obtener cuenta Riot", {
        userId,
        error: linkedAccountError,
      });
    } else {
      userPuuid = linkedAccount?.puuid ?? null;
    }

    const matchParticipantsMap = new Map<string, any>();
    const rankSnapshotsMap = new Map<string, any>();

    if (userPuuid && uniqueMatchIds.length > 0) {
      const { data: matchParticipants, error: matchParticipantsError } =
        await supabase
          .from("match_participants")
          .select(
            `
            match_id, champion_id, champion_name, role, lane, kills, deaths, assists, kda,
            total_minions_killed, neutral_minions_killed, vision_score,
            total_damage_dealt_to_champions, gold_earned, damage_dealt_to_turrets,
            item0, item1, item2, item3, item4, item5, item6,
            summoner1_id, summoner2_id, perk_primary_style, perk_sub_style,
            ranking_position, performance_score, win,
            matches(match_id, game_creation, game_duration, queue_id, data_version, full_json)
          `
          )
          .eq("puuid", userPuuid)
          .in("match_id", uniqueMatchIds);

      if (matchParticipantsError) {
        console.warn(
          "[Perfil Actividades API] Error obteniendo match_participants",
          matchParticipantsError
        );
      } else {
        matchParticipants?.forEach((participant) => {
          matchParticipantsMap.set(participant.match_id, participant);
        });
      }

      const { data: rankSnapshots, error: rankSnapshotsError } = await supabase
        .from("match_participant_ranks")
        .select("match_id, tier, rank, league_points, wins, losses")
        .eq("puuid", userPuuid)
        .in("match_id", uniqueMatchIds);

      if (rankSnapshotsError) {
        console.warn(
          "[Perfil Actividades API] Error obteniendo match_participant_ranks",
          rankSnapshotsError
        );
      } else {
        rankSnapshots?.forEach((rank) => {
          rankSnapshotsMap.set(rank.match_id, rank);
        });
      }
    }

    const actividadesPartidas = partidasData.map((partida) => {
      const metadata = parseMetadata(partida.metadata);
      const participant = matchParticipantsMap.get(partida.match_id);
      const rankSnapshot = rankSnapshotsMap.get(partida.match_id);

      const matchInfo = participant?.matches
        ? Array.isArray(participant.matches)
          ? participant.matches[0]
          : participant.matches
        : null;

      const championName =
        participant?.champion_name ||
        metadata.championName ||
        "Campeón desconocido";
      const championId = participant?.champion_id || metadata.championId || 0;
      const role = participant?.role || metadata.role || "Desconocido";
      const lane = participant?.lane || metadata.lane || role;

      const kills = participant?.kills ?? metadata.kills ?? 0;
      const deaths = participant?.deaths ?? metadata.deaths ?? 0;
      const assists = participant?.assists ?? metadata.assists ?? 0;
      const kdaValue =
        typeof participant?.kda === "number"
          ? participant?.kda
          : typeof metadata.kda === "number"
          ? metadata.kda
          : deaths > 0
          ? (kills + assists) / Math.max(deaths, 1)
          : kills + assists;

      const totalCS =
        (participant?.total_minions_killed ?? 0) +
        (participant?.neutral_minions_killed ?? 0);
      const gameDurationSeconds =
        matchInfo?.game_duration ?? metadata.gameDuration ?? 0;
      const csPerMin = gameDurationSeconds
        ? Number((totalCS / Math.max(gameDurationSeconds / 60, 1)).toFixed(1))
        : 0;

      const items = participant
        ? [
            participant.item0 ?? 0,
            participant.item1 ?? 0,
            participant.item2 ?? 0,
            participant.item3 ?? 0,
            participant.item4 ?? 0,
            participant.item5 ?? 0,
            participant.item6 ?? 0,
          ]
        : Array.isArray(metadata.items)
        ? [...metadata.items, 0, 0, 0, 0, 0, 0, 0].slice(0, 7)
        : [0, 0, 0, 0, 0, 0, 0];

      const resultWin = participant?.win ?? Boolean(metadata.win);
      const queueId = matchInfo?.queue_id ?? metadata.queueId ?? 0;
      const gameDuration = gameDurationSeconds;
      const gameCreation =
        matchInfo?.game_creation ?? metadata.gameCreation ?? 0;
      const dataVersion = matchInfo?.data_version ?? metadata.dataVersion ?? "";

      let perks = null;
      if (matchInfo?.full_json?.info?.participants) {
        const participantDetail = matchInfo.full_json.info.participants.find(
          (p: any) => p.puuid === (participant?.puuid || userPuuid)
        );
        perks = participantDetail?.perks ?? null;
      }

      return {
        id: `lol_match-${partida.id}`,
        type: "lol_match" as const,
        title: `Partida con ${championName}`,
        preview: resultWin
          ? "Victoria en League of Legends"
          : "Derrota en League of Legends",
        timestamp: partida.created_at,
        category: "League of Legends",
        matchId: partida.match_id,
        championId,
        championName,
        role,
        lane,
        win: resultWin,
        kda: Number.isFinite(kdaValue) ? Number(kdaValue) : undefined,
        kills,
        deaths,
        assists,
        totalCS,
        csPerMin,
        visionScore: participant?.vision_score ?? metadata.visionScore ?? 0,
        damageToChampions:
          participant?.total_damage_dealt_to_champions ??
          metadata.damageDealt ??
          0,
        damageToTurrets: participant?.damage_dealt_to_turrets ?? 0,
        goldEarned: participant?.gold_earned ?? metadata.goldEarned ?? 0,
        items,
        summoner1Id: participant?.summoner1_id ?? 0,
        summoner2Id: participant?.summoner2_id ?? 0,
        perkPrimaryStyle: participant?.perk_primary_style ?? 0,
        perkSubStyle: participant?.perk_sub_style ?? 0,
        perks,
        rankingPosition: participant?.ranking_position ?? null,
        performanceScore: participant?.performance_score ?? null,
        queueId,
        gameDuration,
        gameCreation,
        dataVersion,
        tier: rankSnapshot?.tier ?? null,
        rank: rankSnapshot?.rank ?? null,
        leaguePoints: rankSnapshot?.league_points ?? 0,
        rankWins: rankSnapshot?.wins ?? 0,
        rankLosses: rankSnapshot?.losses ?? 0,
        comment: metadata.comment || null,
      };
    });

    // Combinar todas las actividades
    const todasActividades = [
      ...actividadesNoticias,
      ...actividadesComentarios,
      ...actividadesHilos,
      ...actividadesRespuestas,
      ...actividadesPartidas,
    ];

    // Ordenar por fecha más reciente
    todasActividades.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limitar al número solicitado
    const actividadesPaginadas = todasActividades.slice(0, limit);

    return NextResponse.json({
      items: actividadesPaginadas,
      page,
      limit,
      hasMore: todasActividades.length > limit,
    });

    // La lógica anterior era incorrecta:
    // hasMore: todasActividades.length === limit
    // Esto siempre devolvía true cuando había exactamente 'limit' actividades,
    // lo que causaba un bucle infinito de solicitudes
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}

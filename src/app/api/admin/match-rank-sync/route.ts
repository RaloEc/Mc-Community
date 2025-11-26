import { NextRequest, NextResponse } from "next/server";
import { createClient, getServiceClient } from "@/lib/supabase/server";
import { getPlayerRanking } from "@/lib/riot/league";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const DEFAULT_PLATFORM_REGION = "la1"; // Ajustar según tu región principal

interface SyncResult {
  processed: number;
  synced: number;
  failed: number;
  skipped: number;
  message: string;
  pendingCount: number;
}

/**
 * POST /api/admin/match-rank-sync
 * Ejecuta la sincronización de rangos para registros pendientes
 *
 * Body opcional:
 * - force: boolean - Ejecutar aunque esté deshabilitado
 * - limit: number - Cantidad máxima de registros a procesar
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación y rol admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es admin
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!perfil || perfil.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener parámetros
    let body: { force?: boolean; limit?: number } = {};
    try {
      body = await request.json();
    } catch {
      // Body vacío es válido
    }

    const forceRun = body.force === true;
    const batchLimit = body.limit || 25;

    // Usar service client para acceder a admin_settings (requiere permisos elevados)
    const serviceClient = getServiceClient();

    // Verificar configuración
    const { data: settings } = await serviceClient
      .from("admin_settings")
      .select("value")
      .eq("key", "match_rank_sync")
      .single();

    const config = settings?.value || {
      enabled: false,
      batch_size: 25,
      delay_ms: 500,
    };

    if (!config.enabled && !forceRun) {
      return NextResponse.json({
        processed: 0,
        synced: 0,
        failed: 0,
        skipped: 0,
        message:
          "La sincronización automática está deshabilitada. Usa force=true para ejecutar manualmente.",
        pendingCount: 0,
      } as SyncResult);
    }

    // Obtener conteo de pendientes
    const { data: countResult } = await serviceClient.rpc(
      "count_pending_rank_syncs"
    );
    const pendingCount = countResult || 0;

    if (pendingCount === 0) {
      // Actualizar última ejecución
      await serviceClient
        .from("admin_settings")
        .update({
          value: {
            ...config,
            last_run: new Date().toISOString(),
            last_result: { message: "Todo está al día", processed: 0 },
          },
          updated_at: new Date().toISOString(),
        })
        .eq("key", "match_rank_sync");

      return NextResponse.json({
        processed: 0,
        synced: 0,
        failed: 0,
        skipped: 0,
        message: "✅ No hay registros pendientes. Todo está al día.",
        pendingCount: 0,
      } as SyncResult);
    }

    // Obtener registros pendientes
    const { data: pendingRecords, error: fetchError } = await serviceClient.rpc(
      "get_pending_rank_syncs",
      { p_limit: Math.min(batchLimit, config.batch_size || 25) }
    );

    if (fetchError) {
      console.error(
        "[match-rank-sync] Error al obtener pendientes:",
        fetchError
      );
      return NextResponse.json(
        { error: "Error al obtener registros pendientes" },
        { status: 500 }
      );
    }

    if (!pendingRecords || pendingRecords.length === 0) {
      return NextResponse.json({
        processed: 0,
        synced: 0,
        failed: 0,
        skipped: 0,
        message: "✅ No hay registros pendientes. Todo está al día.",
        pendingCount: 0,
      } as SyncResult);
    }

    // Procesar cada registro
    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const delayMs = config.delay_ms || 500;

    for (const record of pendingRecords) {
      try {
        if (!record.puuid) {
          // Sin PUUID, no podemos consultar
          await serviceClient
            .from("match_participant_ranks")
            .update({
              sync_status: "skipped",
              sync_error: "Sin PUUID disponible",
              last_rank_sync: new Date().toISOString(),
            })
            .eq("id", record.id);
          skipped++;
          continue;
        }

        // Verificar si el caché está vigente
        const { data: cacheValid } = await serviceClient.rpc(
          "is_player_rank_cache_fresh",
          {
            p_puuid: record.puuid,
            p_queue_type: "RANKED_SOLO_5x5",
            p_ttl_hours: 12,
          }
        );

        let rankings;

        if (cacheValid) {
          // Usar datos del caché
          const { data: cachedRanks } = await serviceClient
            .from("player_rank_cache")
            .select("*")
            .eq("puuid", record.puuid)
            .in("queue_type", ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]);

          rankings =
            cachedRanks?.map((rank) => ({
              queueType: rank.queue_type,
              tier: rank.tier,
              rank: rank.rank,
              leaguePoints: rank.league_points,
              wins: rank.wins,
              losses: rank.losses,
              summonerId: record.summoner_id,
            })) || [];
        } else {
          // Consultar ranking desde Riot API
          rankings = await getPlayerRanking(
            record.puuid,
            DEFAULT_PLATFORM_REGION,
            RIOT_API_KEY
          );

          // Actualizar caché con los nuevos datos
          for (const ranking of rankings) {
            await serviceClient
              .from("player_rank_cache")
              .upsert({
                puuid: record.puuid,
                queue_type: ranking.queueType,
                tier: ranking.tier,
                rank: ranking.rank,
                league_points: ranking.leaguePoints,
                wins: ranking.wins,
                losses: ranking.losses,
                last_synced_at: new Date().toISOString(),
              })
              .eq("puuid", record.puuid)
              .eq("queue_type", ranking.queueType);
          }
        }

        const soloQRanking = rankings.find(
          (r) => r.queueType === "RANKED_SOLO_5x5"
        );
        const flexRanking = rankings.find(
          (r) => r.queueType === "RANKED_FLEX_SR"
        );

        if (!soloQRanking && !flexRanking) {
          // Jugador sin rango competitivo
          await serviceClient
            .from("match_participant_ranks")
            .update({
              sync_status: "synced",
              sync_error: null,
              last_rank_sync: new Date().toISOString(),
            })
            .eq("id", record.id);
          synced++;
        } else {
          // Actualizar con datos de ranking
          const updatePayload: Record<string, unknown> = {
            sync_status: "synced",
            sync_error: null,
            last_rank_sync: new Date().toISOString(),
          };

          if (soloQRanking) {
            Object.assign(updatePayload, {
              tier: soloQRanking.tier,
              rank: soloQRanking.rank,
              league_points: soloQRanking.leaguePoints,
              wins: soloQRanking.wins,
              losses: soloQRanking.losses,
              solo_tier: soloQRanking.tier,
              solo_rank: soloQRanking.rank,
              solo_league_points: soloQRanking.leaguePoints,
              solo_wins: soloQRanking.wins,
              solo_losses: soloQRanking.losses,
            });
          }

          if (flexRanking) {
            Object.assign(updatePayload, {
              flex_tier: flexRanking.tier,
              flex_rank: flexRanking.rank,
              flex_league_points: flexRanking.leaguePoints,
              flex_wins: flexRanking.wins,
              flex_losses: flexRanking.losses,
            });
          }

          const { error: updateError } = await serviceClient
            .from("match_participant_ranks")
            .update(updatePayload)
            .eq("id", record.id);

          if (updateError) {
            console.error(
              `[match-rank-sync] Error al actualizar ${record.id}:`,
              updateError
            );
            failed++;
          } else {
            synced++;
          }
        }

        // Delay entre requests para respetar rate limits
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error(
          `[match-rank-sync] Error procesando ${record.id}:`,
          error
        );

        // Marcar como fallido
        await serviceClient
          .from("match_participant_ranks")
          .update({
            sync_status: "failed",
            sync_error:
              error instanceof Error ? error.message : "Error desconocido",
            last_rank_sync: new Date().toISOString(),
          })
          .eq("id", record.id);

        failed++;
      }
    }

    const processed = pendingRecords.length;
    const remainingPending = pendingCount - synced;

    // Actualizar última ejecución en settings
    await serviceClient
      .from("admin_settings")
      .update({
        value: {
          ...config,
          last_run: new Date().toISOString(),
          last_result: { processed, synced, failed, skipped },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "match_rank_sync");

    const result: SyncResult = {
      processed,
      synced,
      failed,
      skipped,
      message: `Procesados ${processed} registros: ${synced} sincronizados, ${failed} fallidos, ${skipped} omitidos.`,
      pendingCount: Math.max(0, remainingPending),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[match-rank-sync] Error general:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/match-rank-sync
 * Obtiene el estado actual de la sincronización
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es admin
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!perfil || perfil.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Usar service client para acceder a admin_settings
    const serviceClient = getServiceClient();

    // Obtener configuración
    const { data: settings } = await serviceClient
      .from("admin_settings")
      .select("value, updated_at")
      .eq("key", "match_rank_sync")
      .single();

    // Obtener conteo de pendientes
    const { data: pendingCount } = await serviceClient.rpc(
      "count_pending_rank_syncs"
    );

    return NextResponse.json({
      config: settings?.value || { enabled: false },
      updatedAt: settings?.updated_at,
      pendingCount: pendingCount || 0,
    });
  } catch (error) {
    console.error("[match-rank-sync] Error en GET:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/match-rank-sync
 * Actualiza la configuración de sincronización
 *
 * Body:
 * - enabled: boolean
 * - batch_size?: number
 * - delay_ms?: number
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es admin
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!perfil || perfil.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();

    // Usar service client para acceder a admin_settings
    const serviceClient = getServiceClient();

    // Obtener configuración actual
    const { data: current } = await serviceClient
      .from("admin_settings")
      .select("value")
      .eq("key", "match_rank_sync")
      .single();

    const currentConfig = current?.value || {};

    // Merge con nuevos valores
    const newConfig = {
      ...currentConfig,
      ...(typeof body.enabled === "boolean" && { enabled: body.enabled }),
      ...(typeof body.batch_size === "number" && {
        batch_size: body.batch_size,
      }),
      ...(typeof body.delay_ms === "number" && { delay_ms: body.delay_ms }),
    };

    // Actualizar
    const { error } = await serviceClient
      .from("admin_settings")
      .update({
        value: newConfig,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq("key", "match_rank_sync");

    if (error) {
      console.error("[match-rank-sync] Error al actualizar config:", error);
      return NextResponse.json(
        { error: "Error al actualizar configuración" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: newConfig,
    });
  } catch (error) {
    console.error("[match-rank-sync] Error en PATCH:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

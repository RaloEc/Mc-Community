"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import React from "react";
import {
  MatchCard,
  MobileMatchCard,
  getLatestDDragonVersion,
  FALLBACK_VERSION,
} from "./match-card";
import type { Match } from "./match-card";

interface MatchHistoryListProps {
  userId?: string;
  puuid?: string;
}

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  avgDamage: number;
  avgGold: number;
}

interface LinkedAccountEntry {
  puuid: string;
  userId: string;
  publicId: string | null;
}

interface LinkedAccountsResponse {
  accounts: LinkedAccountEntry[];
}

interface MatchHistoryPage {
  success: boolean;
  matches: Match[];
  stats: PlayerStats;
  hasMore: boolean;
  nextCursor: number | null;
}

const QUEUE_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Ranked SoloQ", value: "soloq" },
  { label: "Flex", value: "flex" },
  { label: "Normales", value: "normals" },
  { label: "ARAM", value: "aram" },
  { label: "URF", value: "urf" },
];

const MATCHES_PER_PAGE = 20;
const DEFAULT_STATS: PlayerStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  winrate: 0,
  avgKda: 0,
  avgDamage: 0,
  avgGold: 0,
};

/**
 * Componente principal para mostrar historial de partidas
 */
export function MatchHistoryList({
  userId: propUserId,
  puuid,
}: MatchHistoryListProps = {}) {
  const queryClient = useQueryClient();
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<string>(
    QUEUE_FILTERS[0].value
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [lastStableMatches, setLastStableMatches] = useState<Match[]>([]);
  const [isFilterTransition, setIsFilterTransition] = useState(false);

  // Obtener user_id del contexto o localStorage si no se pasa por props
  useEffect(() => {
    if (!propUserId) {
      const id = localStorage.getItem("user_id");
      setLocalUserId(id);
    }
  }, [propUserId]);

  const { data: ddragonVersion = FALLBACK_VERSION } = useQuery({
    queryKey: ["ddragon-version"],
    queryFn: getLatestDDragonVersion,
    staleTime: 60 * 60 * 1000,
    initialData: FALLBACK_VERSION,
  });

  const userId = propUserId || localUserId;

  const matchHistoryQueryKey = useMemo(
    () => ["match-history", userId, queueFilter],
    [userId, queueFilter]
  );

  const initialMatchHistory = userId
    ? queryClient.getQueryData<InfiniteData<MatchHistoryPage>>(
        matchHistoryQueryKey
      ) ?? undefined
    : undefined;

  // Query global para obtener PUUIDs de jugadores registrados
  const { data: linkedAccountsData } = useQuery<LinkedAccountsResponse>({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/riot/linked-accounts");
      if (!res.ok) throw new Error("Error al obtener cuentas enlazadas");
      return (await res.json()) as LinkedAccountsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const linkedAccounts = linkedAccountsData?.accounts ?? [];
  const linkedAccountsMap = linkedAccounts.reduce<Record<string, string>>(
    (acc, account) => {
      if (account.publicId) {
        acc[account.puuid] = account.publicId;
      }
      return acc;
    },
    {}
  );

  // Query para obtener historial de partidas
  const {
    data: matchPages,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MatchHistoryPage>({
    queryKey: matchHistoryQueryKey,
    queryFn: async ({ pageParam }) => {
      if (!userId) throw new Error("No user");

      const params = new URLSearchParams();
      params.set("limit", MATCHES_PER_PAGE.toString());

      if (queueFilter && queueFilter !== "all") {
        params.set("queue", queueFilter);
      }

      if (typeof pageParam === "number") {
        params.set("cursor", pageParam.toString());
      }

      const response = await fetch(`/api/riot/matches?${params.toString()}`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      return (await response.json()) as MatchHistoryPage;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos sin refetch al volver del modal
    gcTime: 30 * 60 * 1000, // 30 minutos en caché antes de garbage collection
    initialPageParam: null,
    initialData: initialMatchHistory,
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) {
        return;
      }

      const threshold = 200;
      const position = container.scrollTop + container.clientHeight;
      const triggerPoint = container.scrollHeight - threshold;

      if (position >= triggerPoint) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Mutación para sincronizar partidas
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user");

      const response = await fetch("/api/riot/matches/sync", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.details || errorData.error || "Failed to sync matches";

        // Si es un error de PUUID inválido, sugerir reautenticación
        if (errorData.error?.includes("PUUID inválido")) {
          throw new Error(
            `${errorMessage}\n\nIntenta reautenticarte: /api/riot/reauth`
          );
        }

        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["match-history", userId, queueFilter],
      });
    },
  });

  const pages = matchPages?.pages ?? [];
  const matches = useMemo(
    () => pages.flatMap((page) => page.matches ?? []),
    [pages]
  );
  const serverStats = pages[0]?.stats ?? DEFAULT_STATS;

  useEffect(() => {
    if (!isLoading && matches.length > 0) {
      setLastStableMatches((prev) => (prev === matches ? prev : matches));
      setIsFilterTransition(false);
    }
  }, [isLoading, matches]);

  const matchesToRender = matches.length > 0 ? matches : lastStableMatches;

  const stats = useMemo(() => {
    if (matches.length === 0) {
      return serverStats;
    }

    const wins = matches.filter((match) => match.win).length;
    const losses = matches.length - wins;
    const avgKda =
      matches.reduce((sum, match) => sum + (match.kda ?? 0), 0) /
      matches.length;
    const avgDamage =
      matches.reduce((sum, match) => sum + (match.total_damage_dealt ?? 0), 0) /
      matches.length;
    const avgGold =
      matches.reduce((sum, match) => sum + (match.gold_earned ?? 0), 0) /
      matches.length;

    return {
      totalGames: matches.length,
      wins,
      losses,
      winrate:
        matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
      avgKda: Math.round(avgKda * 100) / 100,
      avgDamage: Math.round(avgDamage),
      avgGold: Math.round(avgGold),
    } satisfies PlayerStats;
  }, [matches, serverStats]);

  // Renderizado condicional debe estar después de todos los hooks
  const shouldShowInitialSkeleton =
    isLoading && pages.length === 0 && lastStableMatches.length === 0;

  if (shouldShowInitialSkeleton) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`match-skeleton-${idx}`}
            className="animate-pulse rounded-xl border border-slate-800/70 bg-slate-900/40 p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-slate-800/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-slate-800/80" />
                  <div className="h-3 w-1/4 rounded bg-slate-800/70" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((__, itemIdx) => (
                  <div
                    key={`match-skeleton-item-${idx}-${itemIdx}`}
                    className="h-5 rounded bg-slate-800/60"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        Error al cargar historial de partidas
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl">
        Conecta tu cuenta de Riot para ver tu historial de partidas.
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Encabezado con Estadísticas y filtros */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Historial de Partidas
            </h3>
            <p className="text-sm text-slate-400">
              {stats.totalGames} partidas • {stats.wins}V {stats.losses}D •
              {stats.winrate}% WR
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            size="sm"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUEUE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setQueueFilter(filter.value);
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }
              }}
              disabled={!userId}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                ${
                  queueFilter === filter.value
                    ? "bg-white text-slate-900 border-white"
                    : "text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
                }
                ${!userId ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Partidas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0 custom-scrollbar"
      >
        {matchesToRender.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            No hay partidas registradas
          </div>
        ) : (
          matchesToRender.map((match: Match, idx) => (
            <div
              key={match.id}
              className="match-card-appear space-y-2"
              style={{ animationDelay: `${Math.min(idx, 5) * 80}ms` }}
            >
              <MatchCard
                match={match}
                version={ddragonVersion}
                linkedAccountsMap={linkedAccountsMap}
              />
              <MobileMatchCard match={match} version={ddragonVersion} />
            </div>
          ))
        )}
        <div className="h-1" />
      </div>

      {isFetchingNextPage && (
        <div className="flex items-center justify-center text-slate-400 text-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando más partidas...
        </div>
      )}

      {hasNextPage && !isFetchingNextPage && matches.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={() => fetchNextPage()} variant="outline" size="sm">
            Cargar más partidas
          </Button>
        </div>
      )}
    </div>
  );
}

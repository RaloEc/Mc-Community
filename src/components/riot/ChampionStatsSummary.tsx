"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ChampionStats {
  championName: string;
  championId: number;
  games: number;
  wins: number;
  winrate: number;
}

interface ChampionStatsSummaryProps {
  puuid: string;
  limit?: number;
}

function getChampionImageUrl(championId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/${championId}/tile.jpg`;
}

export function ChampionStatsSummary({
  puuid,
  limit = 5,
}: ChampionStatsSummaryProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    setUserId(id);
  }, []);

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["champion-stats", puuid],
    queryFn: async () => {
      if (!userId) throw new Error("No user");

      const response = await fetch("/api/riot/champion-stats", {
        headers: {
          "x-user-id": userId,
          "x-puuid": puuid,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch champion stats");
      }

      return response.json();
    },
    enabled: !!userId && !!puuid,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !stats?.champions || stats.champions.length === 0) {
    return null;
  }

  const topChampions = stats.champions.slice(0, limit);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-3">
          Campeones Más Jugados
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {topChampions.map((champion: ChampionStats) => (
            <div
              key={champion.championId}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-600">
                <Image
                  src={getChampionImageUrl(champion.championId)}
                  alt={champion.championName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-center text-xs">
                <p className="font-semibold text-white truncate">
                  {champion.championName}
                </p>
                <p className="text-slate-400">{champion.games} partidas</p>
                <p
                  className={`font-bold ${
                    champion.winrate >= 50 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {champion.winrate.toFixed(1)}% WR
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

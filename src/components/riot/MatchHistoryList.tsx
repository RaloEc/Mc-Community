"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { analyzeMatchTags, getTagsInfo } from "@/lib/riot/match-analyzer";

interface Match {
  id: string;
  match_id: string;
  summoner_name: string;
  champion_id: number;
  champion_name: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  total_damage_dealt: number;
  gold_earned: number;
  vision_score: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1_id?: number;
  summoner2_id?: number;
  perk_primary_style?: number;
  perk_sub_style?: number;
  lane: string;
  role: string;
  created_at: string;
  matches: {
    match_id: string;
    game_creation: number;
    game_duration: number;
    game_mode: string;
    queue_id: number;
  };
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

/**
 * Obtiene el nombre de la cola de juego
 */
function getQueueName(queueId: number): string {
  const queueNames: Record<number, string> = {
    400: "Normales",
    420: "SoloQ",
    430: "Normales",
    440: "Flex",
    450: "ARAM",
    700: "Clash",
    900: "URF",
  };
  return queueNames[queueId] || `Queue ${queueId}`;
}

/**
 * Formatea el tiempo relativo
 */
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Hace poco";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-ES");
}

/**
 * Formatea la duración de la partida
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const DDRAGON_VERSION = "14.23.1";

const SUMMONER_SPELL_MAP: Record<number, string> = {
  1: "SummonerCleanse", // Cleanse
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste", // Ghost
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana", // Clarity
  14: "SummonerDot", // Ignite
  21: "SummonerBarrier",
  32: "SummonerSnowball", // Mark
  39: "SummonerSnowURFSnowball_Mark", // Mark in URF
};

/**
 * Obtiene la URL del campeón desde DataDragon
 */
function getChampionImageUrl(championName: string): string {
  // Fallback para Fiddlesticks que a veces viene diferente
  if (championName === "FiddleSticks") championName = "Fiddlesticks";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championName}.png`;
}

/**
 * Obtiene la URL del objeto desde DataDragon
 */
function getItemImageUrl(itemId: number): string {
  if (itemId === 0) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`;
}

/**
 * Obtiene la URL del hechizo desde DataDragon
 */
function getSummonerSpellUrl(summonerId: number): string {
  if (summonerId === 0) return "";
  const spellName = SUMMONER_SPELL_MAP[summonerId];
  if (!spellName) {
    console.warn(
      `[MatchHistoryList] Summoner spell ID ${summonerId} not found in map`
    );
    return "";
  }
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${spellName}.png`;
}

/**
 * Componente para mostrar una tarjeta de partida
 */
function MatchCard({ match }: { match: Match }) {
  const isVictory = match.win;
  const items = [
    match.item0,
    match.item1,
    match.item2,
    match.item3,
    match.item4,
    match.item5,
    match.item6,
  ].filter((id) => id !== 0);

  // Analizar partida para obtener badges
  const tags = analyzeMatchTags({
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    win: match.win,
    gameDuration: match.matches.game_duration,
    totalDamageDealt: match.total_damage_dealt,
    goldEarned: match.gold_earned,
  });

  const tagsInfo = getTagsInfo(tags);

  return (
    <div
      className={`
        hidden md:flex items-center gap-4 p-4 rounded-lg border-l-4 transition-all hover:shadow-md
        ${
          isVictory
            ? "border-l-green-500 bg-green-500/5"
            : "border-l-red-500 bg-red-500/5"
        }
      `}
    >
      {/* Izquierda: Campeón y Hechizos */}
      <div className="flex-shrink-0 relative">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-600">
          <Image
            src={getChampionImageUrl(match.champion_name)}
            alt={match.champion_name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        {/* Hechizos debajo del campeón */}
        <div className="flex gap-0.5 mt-1">
          {match.summoner1_id && (
            <div className="relative w-5 h-5 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(match.summoner1_id) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner1_id)}
                  alt="Summoner 1"
                  fill
                  sizes="20px"
                  className="object-cover"
                  title="D"
                />
              )}
            </div>
          )}
          {match.summoner2_id && (
            <div className="relative w-5 h-5 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(match.summoner2_id) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner2_id)}
                  alt="Summoner 2"
                  fill
                  sizes="20px"
                  className="object-cover"
                  title="F"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Centro-Izquierda: KDA, Resultado y Badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isVictory ? "default" : "destructive"}
            className="text-xs"
          >
            {isVictory ? "VICTORIA" : "DERROTA"}
          </Badge>
          <span className="text-xs text-slate-400">{match.champion_name}</span>
        </div>
        <div className="text-sm font-bold">
          <span className="text-green-400">{match.kills}</span>
          <span className="text-slate-400"> / </span>
          <span className="text-red-400">{match.deaths}</span>
          <span className="text-slate-400"> / </span>
          <span className="text-blue-400">{match.assists}</span>
        </div>
        <div className="text-xs text-slate-400">
          KDA: {match.kda.toFixed(2)}
        </div>
        {/* Badges de análisis */}
        {tagsInfo.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tagsInfo.map((tagInfo) => (
              <div
                key={tagInfo.tag}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tagInfo.color}`}
                title={tagInfo.description}
              >
                {tagInfo.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centro: Objetos */}
      <div className="flex gap-1">
        {items.map((itemId, idx) => (
          <div
            key={idx}
            className="relative w-8 h-8 rounded border border-slate-600 overflow-hidden bg-slate-800"
          >
            {itemId !== 0 && (
              <Image
                src={getItemImageUrl(itemId)}
                alt={`Item ${itemId}`}
                fill
                sizes="32px"
                className="object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Centro-Derecha: Estadísticas */}
      <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-slate-400">Daño</p>
          <p className="font-semibold">
            {(match.total_damage_dealt / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-slate-400">Oro</p>
          <p className="font-semibold">
            {(match.gold_earned / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-slate-400">Visión</p>
          <p className="font-semibold">{match.vision_score}</p>
        </div>
      </div>

      {/* Derecha: Tipo de Juego y Tiempo */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-semibold text-slate-300">
          {getQueueName(match.matches.queue_id)}
        </p>
        <p className="text-xs text-slate-400">
          {formatDuration(match.matches.game_duration)}
        </p>
        <p className="text-xs text-slate-500">
          {getRelativeTime(match.created_at)}
        </p>
      </div>
    </div>
  );
}

/**
 * Componente para mostrar una tarjeta de partida en móvil
 */
function MobileMatchCard({ match }: { match: Match }) {
  const isVictory = match.win;
  const items = [
    match.item0,
    match.item1,
    match.item2,
    match.item3,
    match.item4,
    match.item5,
    match.item6,
  ].filter((id) => id !== 0);

  // Analizar partida para obtener badges
  const tags = analyzeMatchTags({
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    win: match.win,
    gameDuration: match.matches.game_duration,
    totalDamageDealt: match.total_damage_dealt,
    goldEarned: match.gold_earned,
  });

  const tagsInfo = getTagsInfo(tags);
  const ratioClass = match.kda >= 3 ? "text-green-400" : "text-red-400";

  return (
    <div
      className={`
        md:hidden rounded-xl p-4 border transition-all
        ${
          isVictory
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5"
        }
      `}
    >
      {/* Encabezado: Campeón, Resultado y Tiempo */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Campeón */}
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
            <Image
              src={getChampionImageUrl(match.champion_name)}
              alt={match.champion_name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          {/* Info básica */}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="text-sm font-semibold text-white truncate">
                {match.champion_name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {getQueueName(match.matches.queue_id)}
            </p>
          </div>
        </div>

        {/* Tiempo */}
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-xs font-semibold text-slate-300">
            {formatDuration(match.matches.game_duration)}
          </p>
          <p className="text-xs text-slate-500">
            {getRelativeTime(match.created_at)}
          </p>
        </div>
      </div>

      {/* KDA */}
      <div className="mb-3 p-2 rounded-lg bg-slate-900/30">
        <div className="flex justify-between items-center mb-2">
          <div className="text-center flex-1">
            <p className="text-xs text-slate-400">KDA</p>
            <p className="text-sm font-bold">
              <span className="text-green-400">{match.kills}</span>
              <span className="text-slate-400">/</span>
              <span className="text-red-400">{match.deaths}</span>
              <span className="text-slate-400">/</span>
              <span className="text-blue-400">{match.assists}</span>
            </p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-400">Ratio</p>
            <p className={`text-sm font-bold ${ratioClass}`}>
              {match.kda.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas en grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded bg-slate-900/20">
          <p className="text-xs text-slate-400">Daño</p>
          <p className="text-sm font-semibold text-white">
            {(match.total_damage_dealt / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center p-2 rounded bg-slate-900/20">
          <p className="text-xs text-slate-400">Oro</p>
          <p className="text-sm font-semibold text-white">
            {(match.gold_earned / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center p-2 rounded bg-slate-900/20">
          <p className="text-xs text-slate-400">Visión</p>
          <p className="text-sm font-semibold text-white">
            {match.vision_score}
          </p>
        </div>
      </div>

      {/* Hechizos */}
      {(match.summoner1_id || match.summoner2_id) && (
        <div className="mb-3 flex gap-1">
          {match.summoner1_id && (
            <div className="relative w-6 h-6 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(match.summoner1_id) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner1_id)}
                  alt="Summoner 1"
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              )}
            </div>
          )}
          {match.summoner2_id && (
            <div className="relative w-6 h-6 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(match.summoner2_id) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner2_id)}
                  alt="Summoner 2"
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Objetos */}
      {items.length > 0 && (
        <div className="mb-3 flex gap-1 flex-wrap">
          {items.map((itemId, idx) => (
            <div
              key={idx}
              className="relative w-6 h-6 rounded border border-slate-600 overflow-hidden bg-slate-800"
            >
              {itemId !== 0 && (
                <Image
                  src={getItemImageUrl(itemId)}
                  alt={`Item ${itemId}`}
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Badges de análisis */}
      {tagsInfo.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tagsInfo.map((tagInfo) => (
            <div
              key={tagInfo.tag}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tagInfo.color}`}
              title={tagInfo.description}
            >
              {tagInfo.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MatchHistoryListProps {
  userId?: string;
  puuid?: string;
}

/**
 * Componente principal para mostrar historial de partidas
 */
export function MatchHistoryList({
  userId: propUserId,
  puuid,
}: MatchHistoryListProps = {}) {
  const queryClient = useQueryClient();
  const [localUserId, setLocalUserId] = useState<string | null>(null);

  // Obtener user_id del contexto o localStorage si no se pasa por props
  React.useEffect(() => {
    if (!propUserId) {
      const id = localStorage.getItem("user_id");
      setLocalUserId(id);
    }
  }, [propUserId]);

  const userId = propUserId || localUserId;

  // Query para obtener historial de partidas
  const {
    data: matchData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["match-history", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user");

      const response = await fetch("/api/riot/matches", {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

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
      queryClient.invalidateQueries({ queryKey: ["match-history", userId] });
    },
  });

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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

  const matches = matchData?.matches || [];
  const stats = matchData?.stats || {};

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Encabezado con Estadísticas */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-white">
            Historial de Partidas
          </h3>
          <p className="text-sm text-slate-400">
            {stats.totalGames} partidas • {stats.wins}V {stats.losses}D •{" "}
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

      {/* Lista de Partidas */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0 custom-scrollbar">
        {matches.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            No hay partidas registradas
          </div>
        ) : (
          matches.map((match: Match) => (
            <div key={match.id}>
              <MatchCard match={match} />
              <MobileMatchCard match={match} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Importar React para useEffect
import React from "react";

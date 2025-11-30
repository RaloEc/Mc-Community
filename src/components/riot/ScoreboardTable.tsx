"use client";

import React from "react";
import Image from "next/image";
import {
  getChampionImg,
  getItemImg,
  getSpellImg,
  getRuneStyleImg,
} from "@/lib/riot/helpers";
import { formatRankBadge, getTierColor } from "@/lib/riot/league";
import { calculatePerformanceScore } from "@/lib/riot/match-analyzer";

interface ScoreboardTableProps {
  participants: any[];
  currentUserPuuid?: string;
  gameVersion?: string;
  gameDuration?: number;
}

export function ScoreboardTable({
  participants,
  currentUserPuuid,
  gameVersion,
  gameDuration,
}: ScoreboardTableProps) {
  // Función para ordenar jugadores por línea
  const laneOrder: Record<string, number> = {
    TOP: 0,
    JUNGLE: 1,
    MIDDLE: 2,
    BOTTOM: 3,
    UTILITY: 4,
  };

  const sortByLane = (players: any[]) => {
    return [...players].sort((a, b) => {
      const laneA = (a.lane || a.teamPosition || "").toUpperCase();
      const laneB = (b.lane || b.teamPosition || "").toUpperCase();
      return (laneOrder[laneA] ?? 999) - (laneOrder[laneB] ?? 999);
    });
  };

  const getPlayerKey = (player: any) =>
    player.puuid ?? `${player.match_id}-${player.summoner_id ?? player.id}`;

  const team1 = sortByLane(participants.filter((p: any) => p.win)); // Winners (Blue)
  const team2 = sortByLane(participants.filter((p: any) => !p.win)); // Losers (Red)

  // Calculate team stats
  const team1Kills = team1.reduce((acc: number, p: any) => acc + p.kills, 0);
  const team2Kills = team2.reduce((acc: number, p: any) => acc + p.kills, 0);
  const team1Gold = team1.reduce(
    (acc: number, p: any) => acc + p.gold_earned,
    0
  );
  const team2Gold = team2.reduce(
    (acc: number, p: any) => acc + p.gold_earned,
    0
  );
  const team1Damage = team1.reduce(
    (acc: number, p: any) => acc + (p.total_damage_dealt_to_champions ?? 0),
    0
  );
  const team2Damage = team2.reduce(
    (acc: number, p: any) => acc + (p.total_damage_dealt_to_champions ?? 0),
    0
  );

  const winnersStats = {
    kills: team1Kills,
    damage: team1Damage,
    gold: team1Gold,
  };
  const losersStats = {
    kills: team2Kills,
    damage: team2Damage,
    gold: team2Gold,
  };

  const fallbackScoreMap = new Map<string, number>();

  participants.forEach((player: any) => {
    const key = getPlayerKey(player);
    const teamStats = player.win ? winnersStats : losersStats;
    const playerVisionScore = player.vision_score ?? player.visionScore ?? 0;
    const derivedGameDuration =
      gameDuration || player.gameDuration || player.matches?.game_duration || 0;

    const score = calculatePerformanceScore({
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      win: player.win,
      gameDuration: derivedGameDuration,
      goldEarned: player.gold_earned,
      totalDamageDealtToChampions:
        player.total_damage_dealt_to_champions ??
        player.total_damage_dealt ??
        0,
      visionScore: playerVisionScore,
      totalMinionsKilled:
        player.total_minions_killed ?? player.totalMinionsKilled ?? 0,
      neutralMinionsKilled:
        player.neutral_minions_killed ?? player.neutralMinionsKilled ?? 0,
      role: player.role || player.lane,
      teamTotalKills: teamStats.kills,
      teamTotalDamage: teamStats.damage,
      teamTotalGold: teamStats.gold,
      objectivesStolen: player.objectives_stolen ?? 0,
    });

    fallbackScoreMap.set(key, score);
  });

  const fallbackRankingEntries = Array.from(fallbackScoreMap.entries()).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0)
  );
  const fallbackRankingPositions = new Map<string, number>();
  fallbackRankingEntries.forEach(([key], index) => {
    fallbackRankingPositions.set(key, index + 1);
  });

  const playerScores = new Map<string, number>();
  const rankingPositions = new Map<string, number>();

  participants.forEach((player: any) => {
    const key = getPlayerKey(player);
    const persistedScore =
      typeof player.performance_score === "number"
        ? player.performance_score
        : null;
    const persistedRank =
      typeof player.ranking_position === "number" && player.ranking_position > 0
        ? player.ranking_position
        : null;

    const fallbackScore = fallbackScoreMap.get(key) ?? 0;
    const fallbackRank = fallbackRankingPositions.get(key) ?? null;

    playerScores.set(key, persistedScore ?? fallbackScore);
    rankingPositions.set(key, persistedRank ?? fallbackRank ?? 0);
  });

  // Get max damage for scaling bars
  const maxDamage = Math.max(
    ...participants.map((p: any) => p.total_damage_dealt)
  );

  const PlayerRow = ({
    player,
    isCurrentUser,
    isWinner,
    performanceScore,
    rankingPosition,
  }: any) => {
    const displayName =
      player.riotIdGameName && player.riotIdTagLine
        ? player.riotIdGameName
        : player.summoner_name;

    const kdaColor =
      player.kills > player.deaths
        ? "text-green-400"
        : player.deaths > player.kills
        ? "text-red-400"
        : "text-slate-300";

    const kdaRatioColor =
      player.deaths === 0
        ? "text-emerald-400"
        : player.kda >= 4
        ? "text-emerald-400"
        : player.kda >= 2
        ? "text-yellow-400"
        : "text-red-400";

    const damagePercent = (player.total_damage_dealt / maxDamage) * 100;

    // Mapeo de divisiones (usando lane/teamPosition como proxy)
    const divisionMap: Record<string, string> = {
      TOP: "Top",
      JUNGLE: "Jg",
      MIDDLE: "Mid",
      BOTTOM: "ADC",
      UTILITY: "Sup",
    };
    const rawLane = (player.lane || player.teamPosition || "").toUpperCase();
    const division = divisionMap[rawLane] ?? null;

    const totalLaneCS =
      (player.total_minions_killed ?? player.totalMinionsKilled ?? 0) +
      (player.neutral_minions_killed ?? player.neutralMinionsKilled ?? 0);
    const visionScore = player.vision_score ?? player.visionScore ?? 0;

    // Obtener rango real si está disponible
    const tier = player.tier ?? null;
    const rank = player.rank ?? null;
    const rankBadge = formatRankBadge(tier, rank);
    const rankColor = getTierColor(tier);

    const rankingBadgeClass = (() => {
      if (!rankingPosition) {
        return "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
      }
      if (rankingPosition === 1) {
        return "bg-amber-400 text-slate-900 dark:bg-amber-300";
      }
      if (rankingPosition <= 3) {
        return "bg-sky-400 text-slate-900 dark:bg-sky-300";
      }
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100";
    })();

    // Debug info para runas
    if (process.env.NODE_ENV === "development") {
      console.debug("[Scoreboard] Player runes", {
        name: displayName,
        lane: player.lane,
        teamPosition: player.teamPosition,
        perk_primary_style: player.perk_primary_style,
        perk_sub_style: player.perk_sub_style,
        primaryRuneSrc: getRuneStyleImg(player.perk_primary_style || null),
        secondaryRuneSrc: getRuneStyleImg(player.perk_sub_style || null),
      });
    }

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b border-slate-200/70 dark:border-slate-800/40 last:border-0 transition-colors group rounded-none ${
          isCurrentUser
            ? isWinner
              ? "bg-blue-50/80 dark:bg-blue-500/10"
              : "bg-rose-50/80 dark:bg-red-500/10"
            : "bg-white/80 dark:bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
        }`}
      >
        {/* Champion Avatar + Spells + Runes */}
        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="relative flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-slate-500 transition-colors shadow-sm">
              <Image
                src={getChampionImg(player.champion_name, gameVersion)}
                alt={player.champion_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex gap-1">
              {player.summoner1_id &&
                getSpellImg(player.summoner1_id, gameVersion) && (
                  <div className="w-5 h-5 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 flex-shrink-0">
                    <Image
                      src={getSpellImg(player.summoner1_id, gameVersion)!}
                      alt="Spell 1"
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  </div>
                )}
              {player.summoner2_id &&
                getSpellImg(player.summoner2_id, gameVersion) && (
                  <div className="w-5 h-5 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 flex-shrink-0">
                    <Image
                      src={getSpellImg(player.summoner2_id, gameVersion)!}
                      alt="Spell 2"
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            {(() => {
              const primarySrc = getRuneStyleImg(
                player.perk_primary_style || null
              );
              const secondarySrc = getRuneStyleImg(
                player.perk_sub_style || null
              );

              return (
                <>
                  {primarySrc && (
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={primarySrc}
                        alt="Primary Rune"
                        className="w-full h-full object-cover"
                        onLoad={() =>
                          console.debug(
                            "[Scoreboard] Primary rune loaded:",
                            primarySrc
                          )
                        }
                        onError={(e) =>
                          console.error(
                            "[Scoreboard] Primary rune failed:",
                            primarySrc,
                            e
                          )
                        }
                      />
                    </div>
                  )}
                  {secondarySrc && (
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={secondarySrc}
                        alt="Secondary Rune"
                        className="w-full h-full object-cover"
                        onLoad={() =>
                          console.debug(
                            "[Scoreboard] Secondary rune loaded:",
                            secondarySrc
                          )
                        }
                        onError={(e) =>
                          console.error(
                            "[Scoreboard] Secondary rune failed:",
                            secondarySrc,
                            e
                          )
                        }
                      />
                    </div>
                  )}
                </>
              );
            })()}
            <span
              className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow ${rankingBadgeClass}`}
              title={
                performanceScore
                  ? `Posición #${
                      rankingPosition ?? "-"
                    } · Score ${performanceScore.toFixed(1)}`
                  : "Posición no disponible"
              }
            >
              #{rankingPosition ?? "-"}
            </span>
          </div>
        </div>

        {/* KDA Stats */}
        <div className="flex flex-col items-end gap-0.5 min-w-fit">
          <div className={`font-bold text-xs ${kdaColor} text-right`}>
            {player.kills}/{player.deaths}/{player.assists}
          </div>
          <div className={`text-[11px] font-semibold ${kdaRatioColor}`}>
            {player.kda.toFixed(2)}
          </div>
        </div>

        {/* Items Grid + Trinket */}
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-0.5">
            {[
              player.item0,
              player.item1,
              player.item2,
              player.item3,
              player.item4,
              player.item5,
            ].map((item, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden hover:border-blue-200 dark:hover:border-slate-500 transition-colors"
              >
                {item !== 0 && (
                  <Image
                    src={getItemImg(item, gameVersion)!}
                    alt="Item"
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center hover:border-blue-200 dark:hover:border-slate-500 transition-colors">
            {player.item6 !== 0 && (
              <Image
                src={getItemImg(player.item6, gameVersion)!}
                alt="Trinket"
                fill
                sizes="24px"
                className="object-cover"
              />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 min-w-[10px]">
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-white">
              {totalLaneCS.toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-500">CS</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-white">
              {visionScore.toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-500">VIS</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-white">
              {(player.total_damage_dealt / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-500">DMG</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-white">
              {(player.gold_earned / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-500">ORO</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Desktop: Horizontal Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-4">
        {/* Team 1 (Winners) - Left */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
                Victoriaa
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">K:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {team1Kills}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">O:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(team1Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div>
            {team1.map((p: any) => {
              const key = getPlayerKey(p);
              return (
                <PlayerRow
                  key={p.puuid ?? key}
                  player={p}
                  isCurrentUser={p.puuid === currentUserPuuid}
                  isWinner={true}
                  performanceScore={playerScores.get(key)}
                  rankingPosition={rankingPositions.get(key)}
                />
              );
            })}
          </div>
        </div>

        {/* Team 2 (Losers) - Right */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-red-500/20 dark:to-red-500/5 border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-red-500 rounded-full" />
              <h3 className="text-sm font-bold text-rose-600 dark:text-red-300 uppercase tracking-wider">
                Derrota
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">K:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {team2Kills}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">O:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(team2Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div>
            {team2.map((p: any) => {
              const key = getPlayerKey(p);
              return (
                <PlayerRow
                  key={p.puuid ?? key}
                  player={p}
                  isCurrentUser={p.puuid === currentUserPuuid}
                  isWinner={false}
                  performanceScore={playerScores.get(key)}
                  rankingPosition={rankingPositions.get(key)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Layout */}
      <div className="lg:hidden space-y-6">
        {/* Team 1 (Winners) */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-blue-500 rounded-full" />
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
                Victoria
              </h3>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Kills:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {team1Kills}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Oro:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(team1Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            {team1.map((p: any) => {
              const key = getPlayerKey(p);
              return (
                <PlayerRow
                  key={p.puuid ?? key}
                  player={p}
                  isCurrentUser={p.puuid === currentUserPuuid}
                  isWinner={true}
                  performanceScore={playerScores.get(key)}
                  rankingPosition={rankingPositions.get(key)}
                />
              );
            })}
          </div>
        </div>

        {/* Team 2 (Losers) */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
          <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-red-500/20 dark:to-red-500/5 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-red-500 rounded-full" />
              <h3 className="text-sm font-bold text-rose-600 dark:text-red-300 uppercase tracking-wider">
                Derrota
              </h3>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Kills:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {team2Kills}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Oro:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(team2Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            {team2.map((p: any) => {
              const key = getPlayerKey(p);
              return (
                <PlayerRow
                  key={p.puuid ?? key}
                  player={p}
                  isCurrentUser={p.puuid === currentUserPuuid}
                  isWinner={false}
                  performanceScore={playerScores.get(key)}
                  rankingPosition={rankingPositions.get(key)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

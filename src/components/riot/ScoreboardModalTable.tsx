"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  getChampionImg,
  getItemImg,
  getSpellImg,
  getRuneStyleImg,
} from "@/lib/riot/helpers";
import { formatRankBadge, getTierColor } from "@/lib/riot/league";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScoreboardModalTableProps {
  participants: any[];
  currentUserPuuid?: string;
  gameVersion?: string;
}

export function ScoreboardModalTable({
  participants,
  currentUserPuuid,
  gameVersion,
}: ScoreboardModalTableProps) {
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);

  const scrollMobileCarousel = (direction: "prev" | "next") => {
    const container = mobileCarouselRef.current;
    if (!container) return;

    const offset =
      direction === "next" ? container.clientWidth : -container.clientWidth;
    container.scrollBy({ left: offset, behavior: "smooth" });
  };

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

  const team1 = sortByLane(participants.filter((p: any) => p.win));
  const team2 = sortByLane(participants.filter((p: any) => !p.win));

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

  const maxDamage = Math.max(
    ...participants.map((p: any) => p.total_damage_dealt)
  );

  const PlayerRow = ({ player, isCurrentUser, isWinner }: any) => {
    const displayName =
      player.riotIdGameName && player.riotIdTagLine
        ? player.riotIdGameName
        : player.summoner_name;

    const kdaColor =
      player.kills > player.deaths
        ? "text-emerald-700 dark:text-emerald-300"
        : player.deaths > player.kills
        ? "text-rose-700 dark:text-red-300"
        : "text-slate-700 dark:text-slate-300";

    const kdaRatioColor =
      player.deaths === 0
        ? "text-emerald-700 dark:text-emerald-300"
        : player.kda >= 4
        ? "text-emerald-700 dark:text-emerald-300"
        : player.kda >= 2
        ? "text-amber-600 dark:text-yellow-300"
        : "text-rose-700 dark:text-red-300";

    const damagePercent = (player.total_damage_dealt / maxDamage) * 100;

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

    const tier = player.tier ?? null;
    const rank = player.rank ?? null;
    const rankBadge = formatRankBadge(tier, rank);
    const rankColor = getTierColor(tier);

    if (process.env.NODE_ENV === "development") {
      console.debug("[ScoreboardModal] Player runes", {
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
        className={`flex items-center gap-2 px-3 py-2 border-b border-slate-200/70 dark:border-slate-800/40 last:border-0 transition-colors group ${
          isCurrentUser
            ? isWinner
              ? "bg-blue-50/80 dark:bg-blue-500/10"
              : "bg-rose-50/80 dark:bg-red-500/10"
            : "bg-white/80 dark:bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
        }`}
      >
        <div className="flex items-start gap-1.5 flex-shrink-0">
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
                  <div className="w-4 h-4 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 flex-shrink-0">
                    <Image
                      src={getSpellImg(player.summoner1_id, gameVersion)!}
                      alt="Spell 1"
                      width={16}
                      height={16}
                      className="object-cover"
                    />
                  </div>
                )}
              {player.summoner2_id &&
                getSpellImg(player.summoner2_id, gameVersion) && (
                  <div className="w-4 h-4 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 flex-shrink-0">
                    <Image
                      src={getSpellImg(player.summoner2_id, gameVersion)!}
                      alt="Spell 2"
                      width={16}
                      height={16}
                      className="object-cover"
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mt-0">
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
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 flex-shrink-0">
                      <img
                        src={primarySrc}
                        alt="Primary Rune"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {secondarySrc && (
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 flex-shrink-0">
                      <img
                        src={secondarySrc}
                        alt="Secondary Rune"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-semibold text-sm ${
                isCurrentUser
                  ? isWinner
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-rose-600 dark:text-red-300"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {displayName}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {player.champion_name}
            </div>
            {rankBadge && rankBadge !== "Unranked" ? (
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: rankColor || "#94a3b8" }}
                />
                {rankBadge}
              </span>
            ) : division ? (
              <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                {division}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 min-w-fit">
          <div className={`font-bold text-xs ${kdaColor}`}>
            {player.kills}/{player.deaths}/{player.assists}
          </div>
          <div className={`text-[11px] font-semibold ${kdaRatioColor}`}>
            {player.kda.toFixed(2)}
          </div>
        </div>

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
          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center hover:border-blue-200 dark:hover-border-slate-500 transition-colors">
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

        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:gap-x-2 sm:gap-y-1 min-w-[10px]">
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
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-white">
              {(player.total_damage_dealt / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-500">DMG</div>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <div className="text-[11px] font-semibold text-yellow-400">
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
      <div className="hidden lg:grid lg:grid-cols-2 gap-4 my-4">
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
                Victoria
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
                <span className="font-bold text-yellow-500">
                  {(team1Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            {team1.map((p: any) => (
              <PlayerRow
                key={p.puuid}
                player={p}
                isCurrentUser={p.puuid === currentUserPuuid}
                isWinner={true}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
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
                <span className="font-bold text-yellow-500">
                  {(team2Gold / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            {team2.map((p: any) => (
              <PlayerRow
                key={p.puuid}
                player={p}
                isCurrentUser={p.puuid === currentUserPuuid}
                isWinner={false}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        {/* <div className="flex items-center justify-between mb-3 px-1 text-[11px] uppercase tracking-wide text-slate-400">
          <span>Desliza para ver ambos equipos</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollMobileCarousel("prev")}
              className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Equipo anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMobileCarousel("next")}
              className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Siguiente equipo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div> */}

        <div
          ref={mobileCarouselRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="min-w-full snap-center ">
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-blue-500 rounded-full" />
                  <h3 className="text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
                    Victoria
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Kills:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {team1Kills}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Oro:
                    </span>
                    <span className="font-bold text-yellow-500">
                      {(team1Gold / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
              <div>
                {team1.map((p) => (
                  <PlayerRow
                    key={p.puuid}
                    player={p}
                    isCurrentUser={p.puuid === currentUserPuuid}
                    isWinner={true}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-full snap-center">
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/30 shadow-sm">
              <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-red-500/20 dark:to-red-500/5 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-red-500 rounded-full" />
                  <h3 className="text-sm font-bold text-rose-600 dark:text-red-300 uppercase tracking-wider">
                    Derrota
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Kills:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {team2Kills}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Oro:
                    </span>
                    <span className="font-bold text-yellow-500">
                      {(team2Gold / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
              <div>
                {team2.map((p) => (
                  <PlayerRow
                    key={p.puuid}
                    player={p}
                    isCurrentUser={p.puuid === currentUserPuuid}
                    isWinner={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

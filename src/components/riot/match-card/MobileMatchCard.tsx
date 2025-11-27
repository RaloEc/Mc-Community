"use client";

import { useState } from "react";
import Image from "next/image";
import { analyzeMatchTags, getTagsInfo } from "@/lib/riot/match-analyzer";
import { ScoreboardModal } from "@/components/riot/ScoreboardModal";
import type { Match } from "./MatchCard";
import {
  getChampionImageUrl,
  getItemImageUrl,
  getSummonerSpellUrl,
  getQueueName,
  formatDuration,
  getRelativeTime,
  getRuneIconUrl,
} from "./helpers";

interface RiotParticipant {
  teamId: number;
  puuid: string;
  championName: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  summoner1Id?: number;
  summoner2Id?: number;
  perks?: {
    styles?: Array<{
      style?: number;
    }>;
  };
  teamPosition?: string;
  individualPosition?: string;
  lane?: string;
}

const POSITION_ALIASES: Record<string, string> = {
  MID: "MIDDLE",
  BOT: "BOTTOM",
  SUP: "SUPPORT",
  UTILITY: "SUPPORT",
};

function normalizePosition(position?: string | null): string {
  if (!position) return "";
  const upper = position.toUpperCase();
  return POSITION_ALIASES[upper] ?? upper;
}

function getParticipantLane(participant?: RiotParticipant | null): string {
  if (!participant) return "";
  return (
    normalizePosition(participant.teamPosition) ||
    normalizePosition(participant.individualPosition) ||
    normalizePosition(participant.lane)
  );
}

function calculateKda(kills = 0, deaths = 0, assists = 0): number {
  return (kills + assists) / Math.max(1, deaths);
}

function getParticipantRuneStyle(
  participant: RiotParticipant | null | undefined,
  index: number
): number | undefined {
  return participant?.perks?.styles?.[index]?.style;
}

function findLaneOpponent(
  participants: RiotParticipant[],
  player?: RiotParticipant | null
): RiotParticipant | null {
  if (!player) return null;
  const playerLane = getParticipantLane(player);
  const enemyTeamId = player.teamId === 100 ? 200 : 100;
  const enemyCandidates = participants.filter((p) => p.teamId === enemyTeamId);

  if (playerLane) {
    const directMatch = enemyCandidates.find(
      (candidate) => getParticipantLane(candidate) === playerLane
    );
    if (directMatch) return directMatch;
  }

  return enemyCandidates[0] ?? null;
}

interface MobileMatchCardProps {
  match: Match;
  version: string;
}

export function MobileMatchCard({ match, version }: MobileMatchCardProps) {
  const [scoreboardModalOpen, setScoreboardModalOpen] = useState(false);

  if (!match.matches) {
    return null;
  }

  const isVictory = match.win;
  const REMAKE_DURATION_THRESHOLD = 300;
  type RemakeFlagsParticipant = {
    gameEndedInEarlySurrender?: boolean;
    teamEarlySurrendered?: boolean;
  };
  const remakeParticipants = (match.matches?.full_json?.info?.participants ??
    []) as RemakeFlagsParticipant[];
  const isRemake = Boolean(
    (match.matches?.game_duration ?? 0) < REMAKE_DURATION_THRESHOLD ||
      remakeParticipants.some(
        (participant) =>
          participant?.gameEndedInEarlySurrender ||
          participant?.teamEarlySurrendered
      )
  );
  const items = [
    match.item0,
    match.item1,
    match.item2,
    match.item3,
    match.item4,
    match.item5,
    match.item6,
  ].filter((id) => id !== 0);

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
  const queueName = getQueueName(match.matches.queue_id);
  const resultLabel = isRemake ? "Remake" : isVictory ? "Victoria" : "Derrota";
  const resultBadgeClass = isRemake
    ? "text-slate-200 bg-slate-500/10"
    : isVictory
    ? "text-green-300 bg-green-500/10"
    : "text-red-300 bg-red-500/10";

  const participants = (match.matches?.full_json?.info?.participants ??
    []) as RiotParticipant[];
  const currentParticipant =
    participants.find((participant) => participant.puuid === match.puuid) ??
    null;
  const laneOpponent = findLaneOpponent(participants, currentParticipant);
  const opponentKills = laneOpponent?.kills ?? 0;
  const opponentDeaths = laneOpponent?.deaths ?? 0;
  const opponentAssists = laneOpponent?.assists ?? 0;
  const opponentKda = laneOpponent
    ? calculateKda(opponentKills, opponentDeaths, opponentAssists)
    : null;
  const opponentRatioClass =
    opponentKda !== null && opponentKda >= 3
      ? "text-green-300"
      : "text-red-300";
  const playerPrimaryRune = match.perk_primary_style;
  const playerSecondaryRune = match.perk_sub_style;
  const opponentPrimaryRune = getParticipantRuneStyle(laneOpponent, 0);
  const opponentSecondaryRune = getParticipantRuneStyle(laneOpponent, 1);

  const renderSpellIcon = (spellId?: number, alt?: string) => {
    if (!spellId) return null;
    const url = getSummonerSpellUrl(spellId, version);
    if (!url) return null;
    return (
      <div className="relative w-6 h-6 rounded border border-slate-600 overflow-hidden bg-slate-800">
        <Image
          src={url}
          alt={alt ?? "Summoner Spell"}
          fill
          sizes="24px"
          className="object-cover"
        />
      </div>
    );
  };

  const renderRuneIcon = (runeId?: number, alt?: string) => {
    if (!runeId) return null;
    return (
      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-900">
        <Image
          src={getRuneIconUrl(runeId)}
          alt={alt ?? "Rune"}
          fill
          sizes="24px"
          className="object-cover p-0.5"
        />
      </div>
    );
  };

  return (
    <>
      <div
        onClick={() => setScoreboardModalOpen(true)}
        className={`
          md:hidden w-full text-left rounded-xl p-4 border transition-all cursor-pointer
          ${
            isRemake
              ? "border-slate-500/30 bg-slate-500/5 hover:bg-slate-500/10"
              : isVictory
              ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
              : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
          }
        `}
      >
        {/* Encabezado compacto */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-wide text-slate-100 truncate">
              {queueName}
            </span>
            <div className="flex-1 text-center">
              <span
                className={`inline-flex items-center justify-center text-[11px] font-bold uppercase tracking-wide ${resultBadgeClass}`}
              >
                {resultLabel}
              </span>
            </div>
            <div className="flex-1 text-right text-xs">
              <p className="font-semibold text-slate-300">
                {formatDuration(match.matches.game_duration)}
              </p>
              <p className="text-slate-500">
                {getRelativeTime(match.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Campeón principal vs oponente */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                  <Image
                    src={getChampionImageUrl(match.champion_name, version)}
                    alt={match.champion_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {renderRuneIcon(playerPrimaryRune, "Primary Rune")}
                  {renderRuneIcon(playerSecondaryRune, "Secondary Rune")}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-center">
                {renderSpellIcon(match.summoner1_id, "Summoner Spell 1")}
                {renderSpellIcon(match.summoner2_id, "Summoner Spell 2")}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {match.champion_name}
              </p>
              <p className="text-xs text-slate-400">
                {match.kills}/{match.deaths}/{match.assists}
              </p>
              <p className={`text-xs font-semibold ${ratioClass}`}>
                {match.kda.toFixed(2)} KDA
              </p>
            </div>
          </div>

          {laneOpponent && (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                VS
              </span>
              <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-semibold text-white truncate">
                    {laneOpponent.championName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {opponentKills}/{opponentDeaths}/{opponentAssists}
                  </p>
                  <p className={`text-xs font-semibold ${opponentRatioClass}`}>
                    {opponentKda?.toFixed(2) ?? "—"} KDA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                      <Image
                        src={getChampionImageUrl(
                          laneOpponent.championName,
                          version
                        )}
                        alt={laneOpponent.championName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {renderRuneIcon(
                        opponentPrimaryRune,
                        "Enemy Primary Rune"
                      )}
                      {renderRuneIcon(
                        opponentSecondaryRune,
                        "Enemy Secondary Rune"
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    {renderSpellIcon(laneOpponent.summoner1Id, "Enemy Spell 1")}
                    {renderSpellIcon(laneOpponent.summoner2Id, "Enemy Spell 2")}
                  </div>
                </div>
              </div>
            </>
          )}
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
        {/* Objetos */}
        {items.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap justify-center">
            {items.map((itemId, idx) => (
              <div
                key={idx}
                className="relative w-8 h-8 rounded border border-slate-600 overflow-hidden bg-slate-800"
              >
                {itemId !== 0 && (
                  <Image
                    src={getItemImageUrl(itemId, version)}
                    alt={`Item ${itemId}`}
                    fill
                    sizes="32px"
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

      {/* Modal del Scoreboard */}
      <ScoreboardModal
        matchId={match.match_id}
        open={scoreboardModalOpen}
        onOpenChange={setScoreboardModalOpen}
      />
    </>
  );
}

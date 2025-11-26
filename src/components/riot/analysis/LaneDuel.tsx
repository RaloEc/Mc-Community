"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";
import { getChampionImg } from "@/lib/riot/helpers";

interface LaneDuelProps {
  match: any;
  timeline: any;
  focusParticipantId: number;
  opponentParticipantId?: number;
}

export function LaneDuel({
  match,
  timeline,
  focusParticipantId,
  opponentParticipantId,
}: LaneDuelProps) {
  const participants = match.info.participants;
  const gameVersion = match.info.gameVersion;

  const duelData = useMemo(() => {
    if (!match || !timeline) return null;

    const focusPlayer = participants.find(
      (p: any) => p.participantId === focusParticipantId
    );
    if (!focusPlayer) return null;

    let opponent = null;

    if (opponentParticipantId) {
      opponent = participants.find(
        (p: any) => p.participantId === opponentParticipantId
      );
    } else {
      // Find opponent in the same position but different team
      opponent = participants.find(
        (p: any) =>
          p.teamPosition === focusPlayer.teamPosition &&
          p.teamId !== focusPlayer.teamId
      );
    }

    if (!opponent) return null;

    // Get stats at 15 minutes (or end of game if shorter)
    const frame15 =
      timeline.info.frames[15] ||
      timeline.info.frames[timeline.info.frames.length - 1];

    const focusStats = frame15.participantFrames[focusPlayer.participantId];
    const opponentStats = frame15.participantFrames[opponent.participantId];

    return {
      focusPlayer,
      opponent,
      stats: {
        gold: {
          focus: focusStats.totalGold,
          opponent: opponentStats.totalGold,
          diff: focusStats.totalGold - opponentStats.totalGold,
        },
        cs: {
          focus: focusStats.minionsKilled + focusStats.jungleMinionsKilled,
          opponent:
            opponentStats.minionsKilled + opponentStats.jungleMinionsKilled,
          diff:
            focusStats.minionsKilled +
            focusStats.jungleMinionsKilled -
            (opponentStats.minionsKilled + opponentStats.jungleMinionsKilled),
        },
        xp: {
          focus: focusStats.xp,
          opponent: opponentStats.xp,
          diff: focusStats.xp - opponentStats.xp,
        },
        level: {
          focus: focusStats.level,
          opponent: opponentStats.level,
        },
      },
    };
  }, [
    match,
    timeline,
    focusParticipantId,
    opponentParticipantId,
    participants,
  ]);

  if (!duelData) return null;

  const { focusPlayer, opponent, stats } = duelData;

  const StatRow = ({ label, focusValue, opponentValue, unit = "" }: any) => {
    const diff = focusValue - opponentValue;
    const isWinning = diff > 0;
    const color = isWinning
      ? "text-green-400"
      : diff < 0
      ? "text-red-400"
      : "text-slate-400";

    return (
      <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
        <div
          className={`font-mono font-bold w-20 text-right ${
            isWinning ? "text-green-400" : "text-slate-400"
          }`}
        >
          {focusValue.toLocaleString()}
          {unit}
        </div>
        <div className="flex flex-col items-center px-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <span className={`text-xs font-bold ${color}`}>
            {diff > 0 ? "+" : ""}
            {diff.toLocaleString()}
          </span>
        </div>
        <div
          className={`font-mono font-bold w-20 text-left ${
            !isWinning && diff !== 0 ? "text-red-400" : "text-slate-400"
          }`}
        >
          {opponentValue.toLocaleString()}
          {unit}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-slate-900/30 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-center gap-2">
          <Swords className="w-5 h-5 text-yellow-500" />
          Duelo de Línea{" "}
          {/* (Minuto{" "}
          {timeline.info.frames[15]
            ? "15"
            : Math.floor(timeline.info.frames.length - 1)}
          ) */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          {/* Focus Player */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
              <Image
                src={getChampionImg(focusPlayer.championName, gameVersion)}
                alt={focusPlayer.championName}
                fill
                sizes="64px"
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl">
                Lvl {stats.level.focus}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">
                {focusPlayer.championName}
              </div>
              <div className="text-xs text-slate-400">
                {focusPlayer.summonerName}
              </div>
            </div>
          </div>

          <div className="text-2xl font-bold text-slate-600">VS</div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-red-900/50 shadow-lg">
              <Image
                src={getChampionImg(opponent.championName, gameVersion)}
                alt={opponent.championName}
                fill
                sizes="64px"
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl">
                Lvl {stats.level.opponent}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">
                {opponent.championName}
              </div>
              <div className="text-xs text-slate-400">
                {opponent.summonerName}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 bg-slate-950/50 rounded-lg p-4">
          <StatRow
            label="Oro"
            focusValue={stats.gold.focus}
            opponentValue={stats.gold.opponent}
          />
          <StatRow
            label="CS"
            focusValue={stats.cs.focus}
            opponentValue={stats.cs.opponent}
          />
          <StatRow
            label="XP"
            focusValue={stats.xp.focus}
            opponentValue={stats.xp.opponent}
          />
        </div>
      </CardContent>
    </Card>
  );
}

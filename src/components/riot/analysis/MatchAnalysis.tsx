"use client";

import React, { useState, useEffect } from "react";
import { LaneDuel } from "./LaneDuel";
import { MatchGraphs } from "./MatchGraphs";
import { BuildTimeline } from "./BuildTimeline";
import { DamageChart } from "./DamageChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { getChampionImg } from "@/lib/riot/helpers";
import { ArrowRightLeft } from "lucide-react";

interface MatchAnalysisProps {
  match: any;
  timeline: any;
  currentUserPuuid?: string;
}

export function MatchAnalysis({
  match,
  timeline,
  currentUserPuuid,
}: MatchAnalysisProps) {
  const [focusParticipantId, setFocusParticipantId] = useState<number>(1);
  const [opponentParticipantId, setOpponentParticipantId] = useState<
    number | null
  >(null);

  // Normalize match data
  const matchData = match.full_json || match;
  const gameVersion = matchData?.info?.gameVersion;

  // Set initial focus player based on logged-in user
  useEffect(() => {
    if (currentUserPuuid && matchData.info && matchData.info.participants) {
      const participant = matchData.info.participants.find(
        (p: any) => p.puuid === currentUserPuuid
      );
      if (participant) {
        setFocusParticipantId(participant.participantId);
      }
    }
  }, [currentUserPuuid, matchData]);

  // Update opponent when focus player changes (default to lane opponent)
  useEffect(() => {
    if (!matchData.info || !matchData.info.participants) return;

    const focusPlayer = matchData.info.participants.find(
      (p: any) => p.participantId === focusParticipantId
    );

    if (focusPlayer) {
      // Find lane opponent
      const opponent = matchData.info.participants.find(
        (p: any) =>
          p.teamId !== focusPlayer.teamId &&
          (p.lane === focusPlayer.lane || p.role === focusPlayer.role)
      );

      if (opponent) {
        setOpponentParticipantId(opponent.participantId);
      } else {
        // Fallback: first enemy
        const firstEnemy = matchData.info.participants.find(
          (p: any) => p.teamId !== focusPlayer.teamId
        );
        if (firstEnemy) setOpponentParticipantId(firstEnemy.participantId);
      }
    }
  }, [focusParticipantId, matchData]);

  if (!match || !timeline) return null;

  // Safety check for info
  if (!matchData.info || !matchData.info.participants) {
    console.error("MatchAnalysis: Invalid match data structure", match);
    return null;
  }

  const participants = matchData.info.participants;
  const focusPlayer = participants.find(
    (p: any) => p.participantId === focusParticipantId
  );
  const focusTeamId = focusPlayer?.teamId || 100;

  return (
    <div className="space-y-8">
      {/* Player Selectors */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Analizar a:</span>
          <Select
            value={focusParticipantId.toString()}
            onValueChange={(val) => setFocusParticipantId(parseInt(val))}
          >
            <SelectTrigger className="w-[240px] bg-slate-900/50 border-slate-800">
              <SelectValue placeholder="Seleccionar Jugador" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p: any) => (
                <SelectItem
                  key={p.participantId}
                  value={p.participantId.toString()}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-700">
                      <Image
                        src={getChampionImg(p.championName, gameVersion)}
                        alt={p.championName}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{p.championName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ArrowRightLeft className="w-4 h-4 text-slate-600 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">vs</span>
          <Select
            value={opponentParticipantId?.toString() || ""}
            onValueChange={(val) => setOpponentParticipantId(parseInt(val))}
          >
            <SelectTrigger className="w-[240px] bg-slate-900/50 border-slate-800">
              <SelectValue placeholder="Seleccionar Oponente" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p: any) => (
                <SelectItem
                  key={p.participantId}
                  value={p.participantId.toString()}
                  disabled={p.participantId === focusParticipantId}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-700">
                      <Image
                        src={getChampionImg(p.championName, gameVersion)}
                        alt={p.championName}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{p.championName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lane Duel (Head-to-Head) */}
      <LaneDuel
        match={matchData}
        timeline={timeline}
        focusParticipantId={focusParticipantId}
        opponentParticipantId={opponentParticipantId || undefined}
      />

      {/* Graphs */}
      <MatchGraphs timeline={timeline} focusTeamId={focusTeamId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Build Timeline */}
        <BuildTimeline
          timeline={timeline}
          participantId={focusParticipantId}
          gameVersion={gameVersion}
        />

        {/* Damage Chart */}
        <DamageChart
          participants={participants}
          teamId={focusPlayer?.teamId || 100}
        />
      </div>
    </div>
  );
}

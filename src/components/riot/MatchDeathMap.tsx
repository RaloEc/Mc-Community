"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { getChampionImg } from "@/lib/riot/helpers";

interface MatchDeathMapProps {
  timeline: any;
  participants: any[];
  focusTeamId?: number;
  highlightParticipantId?: number;
}

export function MatchDeathMap({
  timeline,
  participants,
  focusTeamId = 100,
  highlightParticipantId,
}: MatchDeathMapProps) {
  const [selectedParticipantId, setSelectedParticipantId] =
    useState<string>("all");

  // Map participantId to champion info
  const participantMap = useMemo(() => {
    const map = new Map();
    participants.forEach((p) => {
      map.set(p.participantId, {
        championName: p.championName,
        summonerName: p.summonerName,
        teamId: p.teamId,
      });
    });
    return map;
  }, [participants]);

  const kills = useMemo(() => {
    if (!timeline || !timeline.info || !timeline.info.frames) return [];

    const killEvents: any[] = [];
    timeline.info.frames.forEach((frame: any) => {
      frame.events.forEach((event: any) => {
        if (event.type === "CHAMPION_KILL") {
          // Filter by participant if selected (either as killer or victim)
          if (selectedParticipantId !== "all") {
            const participantId = parseInt(selectedParticipantId);
            if (
              event.killerId !== participantId &&
              event.victimId !== participantId
            ) {
              return;
            }
          }
          killEvents.push(event);
        }
      });
    });

    return killEvents;
  }, [timeline, selectedParticipantId]);

  const getPosition = (x: number, y: number) => {
    const MAP_SIZE = 14820;
    const left = (x / MAP_SIZE) * 100;
    const bottom = (y / MAP_SIZE) * 100;
    return { left: `${left}%`, bottom: `${bottom}%` };
  };

  if (!timeline) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-lg border border-slate-800">
        <p className="text-slate-400">
          No hay datos de línea de tiempo disponibles
        </p>
      </div>
    );
  }

  const kdaMap = useMemo(() => {
    const map = new Map<
      number,
      { kills: number; deaths: number; assists: number }
    >();
    participants.forEach((p) => {
      map.set(p.participantId, {
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        assists: p.assists || 0,
      });
    });
    return map;
  }, [participants]);

  const team100 = participants.filter((p) => p.teamId === 100);
  const team200 = participants.filter((p) => p.teamId === 200);

  const resolvedFocusTeamId = focusTeamId === 200 ? 200 : 100;
  const yourTeam = resolvedFocusTeamId === 100 ? team100 : team200;
  const enemyTeam = resolvedFocusTeamId === 100 ? team200 : team100;
  const enemyTeamId = resolvedFocusTeamId === 100 ? 200 : 100;

  const baseButtonClass =
    "flex flex-col items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all w-full max-w-[8rem] text-center";

  const getButtonClass = (participantId: number, teamId: number) => {
    const isSelected = selectedParticipantId === participantId.toString();
    const isHighlighted = highlightParticipantId === participantId;
    const highlightClass =
      teamId === 100
        ? "bg-cyan-500/30 border border-cyan-400"
        : "bg-rose-500/30 border border-rose-400";
    const defaultClass =
      "bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50";
    const stateClass = isSelected ? highlightClass : defaultClass;
    const primaryHighlight = isHighlighted
      ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900"
      : "";
    return `${baseButtonClass} ${stateClass} ${primaryHighlight}`;
  };

  const yourLabelClass =
    resolvedFocusTeamId === 100 ? "text-cyan-400" : "text-rose-400";
  const enemyLabelClass =
    resolvedFocusTeamId === 100 ? "text-rose-400" : "text-cyan-400";

  const yourLegendDotClass =
    resolvedFocusTeamId === 100
      ? "w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"
      : "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]";

  const enemyLegendDotClass =
    resolvedFocusTeamId === 100
      ? "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]"
      : "w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Map + Legend */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-6">
        {/* Left Panel: Buttons + Legend */}
        <div className="order-2 lg:order-1 flex flex-col gap-4 w-full lg:w-auto items-center mx-auto">
          {/* Team Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            {/* Your Team */}
            <div className="flex-1 sm:flex-none w-full max-w-xs items-center flex flex-col">
              <div
                className={`text-xs font-semibold mb-2 text-center ${yourLabelClass}`}
              >
                Tu equipo
              </div>
              <div className="flex flex-col gap-2 items-center w-full">
                {yourTeam.map((p) => (
                  <button
                    key={p.participantId}
                    onClick={() =>
                      setSelectedParticipantId(p.participantId.toString())
                    }
                    className={getButtonClass(p.participantId, p.teamId)}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-600 shadow-inner">
                      <Image
                        src={getChampionImg(p.championName)}
                        alt={p.championName}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span className="text-[11px] text-white font-semibold truncate w-full">
                        {p.summonerName || p.riotIdGameName || p.championName}
                      </span>
                      <span className="text-[10px] text-slate-300 truncate w-full">
                        {p.championName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {(() => {
                          const stats = kdaMap.get(p.participantId);
                          if (!stats) return "0/0/0";
                          return `${stats.kills}/${stats.deaths}/${stats.assists}`;
                        })()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enemy Team */}
            <div className="flex-1 sm:flex-none w-full max-w-xs items-center flex flex-col">
              <div
                className={`text-xs font-semibold mb-2 text-center ${enemyLabelClass}`}
              >
                Equipo enemigo
              </div>
              <div className="flex flex-col gap-2 items-center w-full">
                {enemyTeam.map((p) => (
                  <button
                    key={p.participantId}
                    onClick={() =>
                      setSelectedParticipantId(p.participantId.toString())
                    }
                    className={getButtonClass(p.participantId, p.teamId)}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-600 shadow-inner">
                      <Image
                        src={getChampionImg(p.championName)}
                        alt={p.championName}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span className="text-[11px] text-white font-semibold truncate w-full">
                        {p.summonerName || p.riotIdGameName || p.championName}
                      </span>
                      <span className="text-[10px] text-slate-300 truncate w-full">
                        {p.championName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {(() => {
                          const stats = kdaMap.get(p.participantId);
                          if (!stats) return "0/0/0";
                          return `${stats.kills}/${stats.deaths}/${stats.assists}`;
                        })()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legend Centered */}
          <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 text-xs text-white shadow-lg mx-auto w-full">
            <div className="font-semibold mb-2 text-slate-300 uppercase tracking-wider text-[10px] text-center">
              Leyenda
            </div>
            <div className="flex flex-col gap-3 text-slate-200 items-center">
              <div className="flex items-center gap-2">
                <div className={yourLegendDotClass} />
                <span>Tu equipo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={enemyLegendDotClass} />
                <span>Equipo enemigo</span>
              </div>
              <div className="flex items-center gap-2 text-amber-200">
                <div className="w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.9)] border border-amber-200/80" />
                <span>Racha (≥500g)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="order-1 lg:order-2 relative w-full max-w-xl lg:max-w-[32rem] mx-auto lg:mx-0 aspect-square bg-[#0a0a0c] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
          <Image
            src="https://ddragon.leagueoflegends.com/cdn/6.8.1/img/map/map11.png"
            alt="Summoner's Rift"
            fill
            className="object-cover opacity-50 grayscale-[0.3]"
            priority
          />

          {kills.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-500 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                No se encontraron muertes con el filtro actual
              </p>
            </div>
          )}

          {kills.map((kill, idx) => {
            if (!kill.position) return null;

            const pos = getPosition(kill.position.x, kill.position.y);
            const killer = participantMap.get(kill.killerId);
            const victim = participantMap.get(kill.victimId);
            const isBlueTeamKill = killer?.teamId === 100;

            // Color según el equipo que mató
            const colorClass = isBlueTeamKill
              ? "bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.7)]"
              : "bg-rose-500 shadow-[0_0_10px_3px_rgba(244,63,94,0.7)]";

            // Tamaño según bounty (más grande = más oro)
            const sizeClass = kill.bounty >= 500 ? "w-4 h-4" : "w-2.5 h-2.5";

            return (
              <div
                key={idx}
                className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 hover:z-50 cursor-help group z-10 ${colorClass} ${sizeClass}`}
                style={{ left: pos.left, bottom: pos.bottom }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-slate-700 shadow-xl backdrop-blur-md transition-opacity">
                  <div className="font-bold text-red-400 mb-0.5">
                    💀 {victim?.championName || "Desconocido"}
                  </div>
                  <div className="text-green-400 text-[10px]">
                    ⚔️ {killer?.championName || "Desconocido"}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    {Math.floor(kill.timestamp / 60000)}:
                    {((kill.timestamp % 60000) / 1000)
                      .toFixed(0)
                      .padStart(2, "0")}
                  </div>
                  {kill.bounty > 300 && (
                    <div className="text-yellow-400 text-[10px]">
                      💰 {kill.bounty}g
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

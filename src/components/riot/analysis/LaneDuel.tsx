"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getChampionImg } from "@/lib/riot/helpers";

interface LaneDuelProps {
  match: any;
  timeline: any;
  focusParticipantId: number;
  opponentParticipantId?: number;
}

const ADVANTAGE_THRESHOLD = 0.03;
const MS_IN_MINUTE = 60 * 1000;
const MAJOR_ITEM_IDS = new Set([
  6631, 6632, 6630, 6671, 6672, 6673, 3031, 3153, 3508, 6691, 6692, 6693, 6694,
  3078, 3068, 3748, 3074, 3075, 3026, 3089, 3165, 3157, 3115, 3135, 3065, 3083,
]);

type Participant = {
  participantId: number;
  teamId: number;
  championName: string;
  summonerName?: string;
  teamPosition?: string | null;
  individualPosition?: string | null;
  role?: string | null;
  lane?: string | null;
};

type ParticipantFrame = {
  totalGold?: number;
  xp?: number;
  minionsKilled?: number;
  jungleMinionsKilled?: number;
  level?: number;
};

interface TimelineEvent {
  type: string;
  timestamp: number;
  killerId?: number;
  victimId?: number;
  assistingParticipantIds?: number[];
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  laneType?: string;
  towerType?: string;
  teamId?: number;
  killerTeamId?: number;
  participantId?: number;
  itemId?: number;
  bounty?: number;
  shutdown?: number;
  goldGranted?: number;
}

interface TimelineFrame {
  timestamp: number;
  participantFrames: Record<string, ParticipantFrame>;
  events?: TimelineEvent[];
}

type LaneEventType = "kill" | "death" | "roam" | "recall";
type LaneEventImpact = "positive" | "negative" | "neutral";

interface LaneEvent {
  minute: number;
  type: LaneEventType;
  impact: LaneEventImpact;
  comment: string;
}

interface MinuteStat {
  minute: number;
  focus: {
    gold: number;
    xp: number;
    cs: number;
    level: number;
  };
  opponent: {
    gold: number;
    xp: number;
    cs: number;
    level: number;
  };
  goldDiff: number;
  xpDiff: number;
  csDiff: number;
  diffPercent: number;
  color: "positive" | "negative" | "neutral";
  events: LaneEvent[];
}

const normalizeMinute = (timestamp?: number, fallbackIndex = 0) => {
  if (typeof timestamp !== "number") return Math.max(1, fallbackIndex);
  return Math.max(1, Math.floor(timestamp / MS_IN_MINUTE));
};

const getParticipantFrame = (
  frame: TimelineFrame,
  participantId: number
): ParticipantFrame | undefined => {
  const key = participantId.toString();
  return (
    frame.participantFrames?.[key] ?? frame.participantFrames?.[participantId]
  );
};

const formatObjectiveName = (event: TimelineEvent) => {
  if (event.monsterType) {
    if (event.monsterType === "DRAGON") {
      return `dragón ${event.monsterSubType?.toLowerCase() ?? ""}`.trim();
    }
    if (event.monsterType === "RIFTHERALD") return "heraldo";
    if (event.monsterType === "BARON_NASHOR") return "barón";
  }
  if (event.buildingType === "TOWER_BUILDING") {
    return `torreta ${event.laneType?.toLowerCase() ?? ""}`.trim();
  }
  if (event.buildingType === "INHIBITOR_BUILDING") {
    return "inhibidor";
  }
  return "objetivo";
};

const isMajorPurchase = (itemId?: number) => {
  if (!itemId) return false;
  return MAJOR_ITEM_IDS.has(itemId);
};

const getEventDotClass = (event: LaneEvent) => {
  if (event.type === "kill" && event.impact === "positive") {
    return "bg-emerald-300";
  }
  if (event.type === "kill" && event.impact === "negative") {
    return "bg-rose-400";
  }
  if (event.type === "death") {
    return "bg-rose-500";
  }
  if (event.type === "roam") {
    return event.impact === "positive" ? "bg-sky-300" : "bg-sky-600";
  }
  if (event.type === "recall") {
    return event.impact === "positive" ? "bg-amber-300" : "bg-amber-500";
  }
  return "bg-slate-400";
};

const extractLaneEvents = (
  frames: TimelineFrame[],
  focusId: number,
  opponentId: number,
  participantsMap: Map<number, Participant>
): LaneEvent[] => {
  const events: LaneEvent[] = [];

  frames.forEach((frame, index) => {
    (frame.events ?? []).forEach((event) => {
      const minute = normalizeMinute(event.timestamp, index);
      const pushEvent = (
        type: LaneEventType,
        impact: LaneEventImpact,
        comment: string
      ) => {
        events.push({ minute, type, impact, comment });
      };

      if (event.type === "CHAMPION_KILL") {
        const gold = event.bounty ?? event.shutdown ?? event.goldGranted ?? 300;
        const victimName =
          participantsMap.get(event.victimId ?? 0)?.championName ?? "el rival";
        const killerName =
          participantsMap.get(event.killerId ?? 0)?.championName ?? "el rival";

        if (
          event.killerId === focusId ||
          event.assistingParticipantIds?.includes(focusId)
        ) {
          pushEvent(
            "kill",
            "positive",
            `Ganaste ${gold}g eliminando a ${victimName}.`
          );
        } else if (event.victimId === focusId) {
          pushEvent(
            "death",
            "negative",
            `Perdiste la prioridad al caer contra ${killerName}.`
          );
        } else if (
          event.killerId === opponentId ||
          event.assistingParticipantIds?.includes(opponentId)
        ) {
          const rivalName =
            participantsMap.get(opponentId)?.championName ?? "Tu rival";
          pushEvent(
            "kill",
            "negative",
            `${rivalName} aseguró una kill y ganó presión.`
          );
        } else if (event.victimId === opponentId) {
          const rivalName =
            participantsMap.get(opponentId)?.championName ?? "El rival";
          pushEvent(
            "kill",
            "positive",
            `${rivalName} murió y liberaste la línea.`
          );
        }
      }

      if (
        event.type === "ELITE_MONSTER_KILL" ||
        event.type === "BUILDING_KILL"
      ) {
        const objective = formatObjectiveName(event);
        const involvedFocus =
          event.killerId === focusId ||
          event.assistingParticipantIds?.includes(focusId);
        const involvedOpponent =
          event.killerId === opponentId ||
          event.assistingParticipantIds?.includes(opponentId);

        if (involvedFocus) {
          pushEvent(
            "roam",
            "positive",
            `Participaste en ${objective} y mantuviste la ventaja.`
          );
        } else if (involvedOpponent) {
          pushEvent(
            "roam",
            "negative",
            `El rival aseguró ${objective} sin respuesta.`
          );
        }
      }

      if (event.type === "ITEM_PURCHASED" && isMajorPurchase(event.itemId)) {
        if (event.participantId === focusId) {
          pushEvent(
            "recall",
            "positive",
            "Regresaste a base y compraste un power spike."
          );
        } else if (event.participantId === opponentId) {
          pushEvent(
            "recall",
            "negative",
            "Tu rival volvió a base y mejoró su build."
          );
        }
      }
    });
  });

  return events;
};

const formatSigned = (value: number, suffix = "") =>
  `${value > 0 ? "+" : value < 0 ? "" : ""}${value.toLocaleString()}${suffix}`;

const formatPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;

const MinuteTooltip = ({ stat }: { stat: MinuteStat }) => (
  <div className="space-y-2 text-xs">
    <p className="font-semibold text-white">Min {stat.minute}</p>
    <p className="text-slate-300">
      Oro {formatSigned(stat.goldDiff)} · XP {formatSigned(stat.xpDiff)} · CS{" "}
      {formatSigned(stat.csDiff)}
    </p>
    {stat.events.length > 0 ? (
      <ul className="space-y-1 text-slate-200">
        {stat.events.map((event, idx) => (
          <li key={`${stat.minute}-${event.type}-${idx}`}>• {event.comment}</li>
        ))}
      </ul>
    ) : (
      <p className="text-slate-500">Sin eventos relevantes en este minuto.</p>
    )}
  </div>
);

const MinuteTimeline = ({ stats }: { stats: MinuteStat[] }) => {
  if (!stats.length) {
    return (
      <div className="text-sm text-slate-500 text-center">
        Sin datos minuto a minuto.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Min 1</span>
          <span>Duelo minuto a minuto</span>
          <span>Fin</span>
        </div>
        <div className="relative flex h-16 items-center">
          <div className="flex w-full gap-[2px] rounded-full border border-slate-800 bg-slate-950/70 px-2 py-4">
            {stats.map((stat) => (
              <Tooltip key={stat.minute} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    style={{ flex: 1 }}
                    className={cn(
                      "relative h-3 rounded-full transition-colors",
                      stat.color === "positive" &&
                        "bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-400",
                      stat.color === "negative" &&
                        "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400",
                      stat.color === "neutral" &&
                        "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200"
                    )}
                  >
                    {stat.events.length > 0 && (
                      <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 gap-1">
                        {stat.events.slice(0, 3).map((event, idx) => (
                          <span
                            key={`${stat.minute}-${event.type}-${idx}`}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shadow-md",
                              getEventDotClass(event)
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <MinuteTooltip stat={stat} />
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 flex justify-between text-[10px] text-slate-500">
            {stats.map((stat, index) =>
              index % Math.max(1, Math.floor(stats.length / 6)) === 0 ? (
                <span key={`label-${stat.minute}`}>{`Min ${stat.minute}`}</span>
              ) : null
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ventaja
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Parejo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Desventaja
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Kill
            propia
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Kill
            recibida
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />{" "}
            Roam/objetivo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Back /
            power spike
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export function LaneDuel({
  match,
  timeline,
  focusParticipantId,
  opponentParticipantId,
}: LaneDuelProps) {
  const participants = match.info.participants as Participant[];
  const gameVersion = match.info.gameVersion;

  const duelData = useMemo(() => {
    if (!match || !timeline) return null;

    const focusPlayer = participants.find(
      (p) => p.participantId === focusParticipantId
    );
    if (!focusPlayer) return null;

    const opponent = participants.find(
      (p) => p.participantId === (opponentParticipantId ?? 0)
    );
    if (!opponent) return null;

    const frames = (timeline.info?.frames ?? []) as TimelineFrame[];
    if (!frames.length) return null;

    const participantMap = new Map<number, Participant>();
    participants.forEach((p) => participantMap.set(p.participantId, p));

    const minuteStats: MinuteStat[] = [];

    for (let minute = 1; minute < frames.length; minute++) {
      const frame = frames[minute];
      if (!frame || !frame.participantFrames) continue;

      const focusFrame = getParticipantFrame(frame, focusPlayer.participantId);
      const opponentFrame = getParticipantFrame(frame, opponent.participantId);
      if (!focusFrame || !opponentFrame) continue;

      const focusCs =
        (focusFrame.minionsKilled ?? 0) + (focusFrame.jungleMinionsKilled ?? 0);
      const opponentCs =
        (opponentFrame.minionsKilled ?? 0) +
        (opponentFrame.jungleMinionsKilled ?? 0);

      const focusGold = focusFrame.totalGold ?? 0;
      const opponentGold = opponentFrame.totalGold ?? 0;
      const focusXp = focusFrame.xp ?? 0;
      const opponentXp = opponentFrame.xp ?? 0;

      const goldDiff = focusGold - opponentGold;
      const xpDiff = focusXp - opponentXp;
      const csDiff = focusCs - opponentCs;

      const goldPercent = opponentGold ? goldDiff / opponentGold : 0;
      const xpPercent = opponentXp ? xpDiff / opponentXp : 0;
      const csPercent = opponentCs ? csDiff / opponentCs : 0;
      const diffPercent = (goldPercent + xpPercent + csPercent) / 3;

      minuteStats.push({
        minute,
        focus: {
          gold: focusGold,
          xp: focusXp,
          cs: focusCs,
          level: focusFrame.level ?? 1,
        },
        opponent: {
          gold: opponentGold,
          xp: opponentXp,
          cs: opponentCs,
          level: opponentFrame.level ?? 1,
        },
        goldDiff,
        xpDiff,
        csDiff,
        diffPercent,
        color:
          diffPercent > ADVANTAGE_THRESHOLD
            ? "positive"
            : diffPercent < -ADVANTAGE_THRESHOLD
            ? "negative"
            : "neutral",
        events: [],
      });
    }

    if (!minuteStats.length) {
      return {
        focusPlayer,
        opponent,
        minuteStats,
      };
    }

    const events = extractLaneEvents(
      frames,
      focusPlayer.participantId,
      opponent.participantId,
      participantMap
    );

    const statsByMinute = new Map<number, MinuteStat>(
      minuteStats.map((stat) => [stat.minute, stat])
    );
    const lastMinute = minuteStats[minuteStats.length - 1].minute;

    events.forEach((event) => {
      const target =
        statsByMinute.get(event.minute) ||
        statsByMinute.get(event.minute - 1) ||
        statsByMinute.get(Math.min(lastMinute, event.minute + 1));
      if (target) {
        target.events.push(event);
      }
    });

    const minute15Snapshot =
      minuteStats.find((stat) => stat.minute >= 15) ??
      minuteStats[minuteStats.length - 1];
    const latestSnapshot = minuteStats[minuteStats.length - 1];
    const swingMinute = minuteStats.reduce((prev, current) =>
      Math.abs(current.diffPercent) > Math.abs(prev.diffPercent)
        ? current
        : prev
    );

    return {
      focusPlayer,
      opponent,
      minuteStats,
      minute15Snapshot,
      latestSnapshot,
      swingMinute,
    };
  }, [
    match,
    timeline,
    focusParticipantId,
    opponentParticipantId,
    participants,
  ]);

  if (!duelData) return null;

  const {
    focusPlayer,
    opponent,
    minuteStats,
    minute15Snapshot,
    latestSnapshot,
    swingMinute,
  } = duelData;

  return (
    <Card className="bg-slate-900/30 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-center gap-2">
          <Swords className="w-5 h-5 text-yellow-500" />
          Duelo de Línea con contexto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-lg">
                <Image
                  src={getChampionImg(focusPlayer.championName, gameVersion)}
                  alt={focusPlayer.championName}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl">
                  Lvl {minuteStats[minuteStats.length - 1]?.focus.level ?? "-"}
                </div>
              </div>
              <div>
                <p className="font-bold text-white">
                  {focusPlayer.championName}
                </p>
                <p className="text-xs text-slate-400">
                  {focusPlayer.summonerName || ""}
                </p>
              </div>
            </div>

            <div className="text-2xl font-bold text-slate-600">VS</div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-red-900/50 shadow-lg">
                <Image
                  src={getChampionImg(opponent.championName, gameVersion)}
                  alt={opponent.championName}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl">
                  Lvl{" "}
                  {minuteStats[minuteStats.length - 1]?.opponent.level ?? "-"}
                </div>
              </div>
              <div>
                <p className="font-bold text-white">{opponent.championName}</p>
                <p className="text-xs text-slate-400">
                  {opponent.summonerName || ""}
                </p>
              </div>
            </div>
          </div>

          {minuteStats.length ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {minute15Snapshot && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Minuto 15
                    </p>
                    <p className="text-xl font-semibold text-white">
                      Oro {formatSigned(minute15Snapshot.goldDiff)}
                    </p>
                    <p className="text-sm text-slate-400">
                      XP {formatSigned(minute15Snapshot.xpDiff)} · CS{" "}
                      {formatSigned(minute15Snapshot.csDiff)}
                    </p>
                  </div>
                )}

                {latestSnapshot && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Final de partida
                    </p>
                    <p className="text-xl font-semibold text-white">
                      {formatPercent(latestSnapshot.diffPercent)} global
                    </p>
                    <p className="text-sm text-slate-400">
                      Oro {formatSigned(latestSnapshot.goldDiff)} · XP{" "}
                      {formatSigned(latestSnapshot.xpDiff)}
                    </p>
                  </div>
                )}

                {swingMinute && (
                  <div className="md:col-span-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-yellow-500">
                      Momento clave · Min {swingMinute.minute}
                    </p>
                    <p className="text-base font-semibold text-white">
                      {formatPercent(swingMinute.diffPercent)} de swing
                    </p>
                    <p className="text-sm text-slate-200">
                      {swingMinute.events[0]?.comment ||
                        (swingMinute.color === "positive"
                          ? "Tomaste la delantera y controlaste la prioridad."
                          : "El rival capitalizó la línea en ese minuto.")}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <MinuteTimeline stats={minuteStats} />
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400">
              No pudimos generar el timeline minuto a minuto para esta partida.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

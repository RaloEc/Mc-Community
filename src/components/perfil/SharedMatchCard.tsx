"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Trophy,
  Trash2,
  ExternalLink,
  Zap,
  Shield as ShieldIcon,
  Clock,
  MoreVertical,
  Mountain,
  Route,
  Swords,
  Target,
  LifeBuoy,
} from "lucide-react";
import { ChampionCenteredSplash } from "@/components/riot/ChampionCenteredSplash";
import {
  getItemImageUrl,
  getSummonerSpellUrl,
  getRuneIconUrl,
  getQueueName,
  formatDuration,
  getRelativeTime,
} from "@/components/riot/match-card/helpers";
import { getPerkImg } from "@/lib/riot/helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RiotTierBadge } from "@/components/riot/RiotTierBadge";
import type { LucideIcon } from "lucide-react";

export interface SharedMatchData {
  entryId: string;
  matchId: string;
  championId: number;
  championName: string;
  role: string;
  lane: string;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  totalCS: number;
  csPerMin: number;
  visionScore: number;
  damageToChampions: number;
  damageToTurrets: number;
  goldEarned: number;
  items: number[];
  summoner1Id: number;
  summoner2Id: number;
  perkPrimaryStyle: number;
  perkSubStyle: number;
  rankingPosition: number | null;
  performanceScore: number | null;
  result: "win" | "loss";
  queueId: number;
  gameDuration: number;
  gameCreation: number;
  dataVersion: string;
  tier: string | null;
  rank: string | null;
  leaguePoints: number;
  rankWins: number;
  rankLosses: number;
  comment: string | null;
  created_at: string;
  perks?: RunePerks | null;
}

interface SharedMatchCardProps {
  partida: SharedMatchData;
  userColor?: string;
  isOwnProfile?: boolean;
  onDelete?: (entryId: string) => Promise<void>;
  deletingId?: string | null;
}

type RuneSelection = {
  perk?: number;
  var1?: number;
  var2?: number;
  var3?: number;
};

const laneIconMap: Record<string, LucideIcon> = {
  TOP: Mountain,
  JG: Route,
  MID: Swords,
  ADC: Target,
  SUPP: LifeBuoy,
};

type RuneStyle = {
  description?: string;
  style?: number;
  selections?: RuneSelection[];
};

type RunePerks = {
  styles?: RuneStyle[];
  statPerks?: {
    offense?: number;
    flex?: number;
    defense?: number;
  };
};

const RUNE_STYLE_LABELS: Record<number, string> = {
  8000: "Precisión",
  8100: "Dominación",
  8200: "Brujería",
  8300: "Inspiración",
  8400: "Valor",
};

const getRuneStyleLabel = (styleId?: number) => {
  if (!styleId) return "Runas";
  return RUNE_STYLE_LABELS[styleId] ?? "Runas";
};

const normalizeRole = (value?: string) =>
  value?.toUpperCase().replace(/\s+/g, "") ?? "";

const getLaneAbbreviation = (role?: string, lane?: string): string | null => {
  const priority = [role, lane]
    .map((val, index) =>
      index === 0 ? normalizeRole(val) : normalizeRole(val)
    )
    .filter(Boolean);

  const supportRoles = new Set(["DUOSUPPORT", "SUPPORT", "SUPP", "UTILITY"]);

  if (supportRoles.has(priority[0])) return "SUPP";

  const map: Record<string, string> = {
    TOP: "TOP",
    JUNGLE: "JG",
    JUNGLER: "JG",
    JG: "JG",
    MID: "MID",
    MIDDLE: "MID",
    MIDLANE: "MID",
    BOTTOM: "ADC",
    BOT: "ADC",
    ADC: "ADC",
    DUOCARRY: "ADC",
    CARRY: "ADC",
    MARKSMAN: "ADC",
    SUPPORT: "SUPP",
    SUP: "SUPP",
    SUPP: "SUPP",
    DUOSUPPORT: "SUPP",
    UTILITY: "SUPP",
  };

  for (const value of priority) {
    if (!value) continue;
    if (supportRoles.has(value)) return "SUPP";
    if (map[value]) return map[value];
  }

  return null;
};

export const SharedMatchCard = ({
  partida,
  userColor = "#3b82f6",
  isOwnProfile = false,
  onDelete,
  deletingId,
}: SharedMatchCardProps) => {
  const isWin = partida.result === "win";
  const isVictory = isWin;
  const outcomeTextClass = isVictory
    ? "text-emerald-700 dark:text-emerald-200"
    : "text-rose-700 dark:text-rose-200";
  const outcomeBgClass = isVictory
    ? "bg-emerald-100/80 dark:bg-emerald-500/15"
    : "bg-rose-100/80 dark:bg-rose-500/15";

  const colorStyle = {
    "--user-color": userColor,
  } as React.CSSProperties;

  const queueName = getQueueName(partida.queueId);
  const durationLabel = formatDuration(partida.gameDuration);
  const relativeTime = getRelativeTime(partida.created_at);
  const ddragonVersion = partida.dataVersion || "14.23.1";

  const rankLabel = partida.tier
    ? `${partida.tier} ${partida.rank}`
    : "Sin rango";

  const laneAbbreviation = getLaneAbbreviation(partida.role, partida.lane);
  const laneIconKey = laneAbbreviation?.toUpperCase();
  const LaneIcon = laneIconKey ? laneIconMap[laneIconKey] : null;

  const runeStyles = partida.perks?.styles ?? [];
  const primaryStyle =
    runeStyles.find((style) => style.description === "primaryStyle") ??
    runeStyles.find((style) => style.style === partida.perkPrimaryStyle);
  const secondaryStyle =
    runeStyles.find((style) => style.description === "subStyle") ??
    runeStyles.find((style) => style.style === partida.perkSubStyle);
  const statPerks = partida.perks?.statPerks;

  const hasDetailedRunes = Boolean(
    (primaryStyle?.selections && primaryStyle.selections.length > 0) ||
      (secondaryStyle?.selections && secondaryStyle.selections.length > 0) ||
      statPerks?.offense ||
      statPerks?.flex ||
      statPerks?.defense
  );

  const renderRuneSelections = (style?: RuneStyle) => {
    if (!style?.selections?.length) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {style.selections.map((selection, index) => {
          const icon = getPerkImg(selection.perk ?? null);
          const key = `${style.style}-${selection.perk ?? index}`;
          return (
            <div
              key={key}
              className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-900/60 border border-white/10"
            >
              {icon ? (
                <Image
                  src={icon}
                  alt="Runa seleccionada"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderShardIcons = () => {
    if (!statPerks) return null;
    const shards = [
      statPerks.offense,
      statPerks.flex,
      statPerks.defense,
    ].filter(Boolean);
    if (shards.length === 0) return null;
    return (
      <div className="flex items-center gap-2 mt-2">
        {shards.map((shardId, index) => {
          const icon = getPerkImg(shardId ?? null);
          const key = `shard-${shardId ?? index}`;
          return (
            <div
              key={key}
              className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-900/60 border border-white/10"
            >
              {icon ? (
                <Image
                  src={icon}
                  alt="Fragmento"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const RuneTooltipContent = () => {
    if (!hasDetailedRunes) return null;
    return (
      <div className="space-y-3 text-xs">
        {primaryStyle && (
          <div>
            <p className="text-[11px] uppercase font-semibold text-muted-foreground">
              Primaria • {getRuneStyleLabel(primaryStyle.style)}
            </p>
            {renderRuneSelections(primaryStyle)}
          </div>
        )}
        {secondaryStyle && (
          <div>
            <p className="text-[11px] uppercase font-semibold text-muted-foreground">
              Secundaria • {getRuneStyleLabel(secondaryStyle.style)}
            </p>
            {renderRuneSelections(secondaryStyle)}
          </div>
        )}
        {renderShardIcons() && (
          <div>
            <p className="text-[11px] uppercase font-semibold text-muted-foreground">
              Fragmentos
            </p>
            {renderShardIcons()}
          </div>
        )}
      </div>
    );
  };

  const runeIcons = (
    <div className="flex items-center gap-1">
      {partida.perkPrimaryStyle > 0 && (
        <div className="relative w-6 h-6 rounded-full overflow-hidden">
          <Image
            src={getRuneIconUrl(partida.perkPrimaryStyle)}
            alt="Runa primaria"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      {partida.perkSubStyle > 0 && (
        <div className="relative w-5 h-5 rounded-full overflow-hidden">
          <Image
            src={getRuneIconUrl(partida.perkSubStyle)}
            alt="Runa secundaria"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );

  const runeIconsWithTooltip = hasDetailedRunes ? (
    <Tooltip>
      <TooltipTrigger asChild>{runeIcons}</TooltipTrigger>
      <TooltipContent className="w-64 p-3">
        <RuneTooltipContent />
      </TooltipContent>
    </Tooltip>
  ) : (
    runeIcons
  );

  // Calcular color del performance score
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-slate-400";
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 45) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="transition-shadow hover:shadow-xl border-none bg-white/70 dark:bg-slate-950/60 overflow-hidden">
        <div className="relative min-h-[28rem]">
          {/* Splash art base */}
          <div className="absolute inset-0 overflow-hidden">
            <ChampionCenteredSplash
              championName={partida.championName}
              skinId={0}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/75 to-transparent dark:from-black/20 dark:via-black/60 dark:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-transparent to-white/25 dark:from-black/35 dark:via-transparent dark:to-black/55" />
          </div>

          {/* Contenido superpuesto */}
          <div className="relative z-10 flex flex-col gap-5 p-4 sm:p-6 text-slate-900 dark:text-white">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="flex-grow min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${outcomeBgClass} ${outcomeTextClass}`}
                    >
                      {isVictory ? "Victoria" : "Derrota"}
                    </span>
                    {partida.tier && (
                      <div className="inline-flex items-center gap-2 bg-black/50 rounded-full pl-1 pr-2 py-0.5">
                        <RiotTierBadge
                          tier={partida.tier}
                          rank={partida.rank}
                          size="sm"
                        />
                        <span className="text-[11px] font-semibold text-slate-900 dark:text-white/85">
                          {rankLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center gap-2">
                      <span>{partida.championName}</span>
                      {laneAbbreviation && (
                        <span className="text-xs font-semibold tracking-wide uppercase bg-white/70 text-slate-900 dark:bg-white/15 dark:text-white rounded-full px-2 py-0.5 flex items-center gap-1">
                          {LaneIcon && <LaneIcon className="w-3 h-3" />}
                          {laneAbbreviation}
                        </span>
                      )}
                    </h3>
                    {partida.rankingPosition && (
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full font-semibold text-white drop-shadow-lg text-xs"
                        style={{
                          backgroundColor:
                            partida.rankingPosition === 1
                              ? "rgba(34, 197, 94, 0.85)"
                              : "rgba(100, 116, 139, 0.75)",
                        }}
                      >
                        #{partida.rankingPosition}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-white/80">
                    {runeIconsWithTooltip}
                    <span className="h-4 w-px bg-white/25" />
                    <div className="flex items-center gap-1 text-slate-600 dark:text-white">
                      {partida.summoner1Id > 0 && (
                        <div className="relative w-6 h-6 rounded bg-white/15 overflow-hidden">
                          <Image
                            src={getSummonerSpellUrl(
                              partida.summoner1Id,
                              ddragonVersion
                            )}
                            alt="Hechizo 1"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      {partida.summoner2Id > 0 && (
                        <div className="relative w-6 h-6 rounded bg-white/15 overflow-hidden">
                          <Image
                            src={getSummonerSpellUrl(
                              partida.summoner2Id,
                              ddragonVersion
                            )}
                            alt="Hechizo 2"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                    <span className="h-4 w-px bg-white/25" />
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{relativeTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/match/${partida.matchId}`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-slate-900/30 text-slate-900 font-semibold hover:bg-slate-900/10 transition-colors text-sm dark:border-white/40 dark:text-white dark:hover:bg-white/15"
                  >
                    Ver análisis completo
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-white/85">
                <span className="font-medium">{queueName}</span>
                <span>•</span>
                <span>{durationLabel}</span>
              </div>
            </div>

            {/* Stats principales */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                {
                  label: "KDA",
                  value: partida.kda.toFixed(2),
                  sub: `${partida.kills}/${partida.deaths}/${partida.assists}`,
                  accentClass: outcomeTextClass,
                },
                {
                  label: "CS",
                  value: partida.totalCS.toString(),
                  sub: `${partida.csPerMin.toFixed(1)}/min`,
                },
                {
                  label: "Visión",
                  value: partida.visionScore.toString(),
                },
                {
                  label: "Score",
                  value: partida.performanceScore
                    ? partida.performanceScore.toFixed(0)
                    : "-",
                  accentClass: getScoreColor(partida.performanceScore),
                },
                {
                  label: "Daño",
                  value: `${(partida.damageToChampions / 1000).toFixed(1)}k`,
                  sub: "champ",
                },
                {
                  label: "Oro",
                  value: `${(partida.goldEarned / 1000).toFixed(1)}k`,
                  sub: "total",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-2 shadow-sm dark:border-white/20 dark:bg-white/10"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase text-slate-500 dark:text-white/60">
                    <span className="font-semibold tracking-wide">
                      {stat.label}
                    </span>
                    {stat.sub && (
                      <span className="text-[9px] text-slate-400 dark:text-white/50">
                        {stat.sub}
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-1 text-base sm:text-lg font-semibold leading-none ${
                      stat.accentClass ?? "text-slate-900 dark:text-white"
                    }`}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Build */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70">
                Build
              </div>
              <div className="flex flex-wrap gap-1.5">
                {partida.items.slice(0, 6).map((itemId, idx) => (
                  <div
                    key={idx}
                    className="relative w-9 h-9 rounded border border-slate-200 overflow-hidden bg-white/90 shadow-sm dark:border-white/20 dark:bg-white/10"
                  >
                    {itemId > 0 && (
                      <Image
                        src={getItemImageUrl(itemId, ddragonVersion)}
                        alt={`Item ${itemId}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comentario */}
            {partida.comment && (
              <div className="bg-white/90 border border-slate-200 rounded p-3 text-sm text-slate-800 italic shadow-sm dark:bg-white/10 dark:border-white/20 dark:text-white/90">
                "{partida.comment}"
              </div>
            )}

            {/* Footer acciones */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="ml-auto flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-600 hover:bg-slate-900/5 dark:text-white/80 dark:hover:bg-white/10"
                      aria-label="Acciones de la partida"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/match/${partida.matchId}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver partida
                      </Link>
                    </DropdownMenuItem>
                    {isOwnProfile && onDelete && (
                      <DropdownMenuItem
                        disabled={deletingId === partida.entryId}
                        className="text-red-600 focus:text-red-600"
                        onSelect={(event) => {
                          event.preventDefault();
                          onDelete(partida.entryId);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingId === partida.entryId
                          ? "Eliminando..."
                          : "Eliminar"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

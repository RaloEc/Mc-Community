import Image from "next/image";
import { analyzeMatchTags, getTagsInfo } from "@/lib/riot/match-analyzer";
import type { Match } from "./MatchCard";
import {
  getChampionImageUrl,
  getItemImageUrl,
  getSummonerSpellUrl,
  getQueueName,
  formatDuration,
  getRelativeTime,
} from "./helpers";

interface MobileMatchCardProps {
  match: Match;
  version: string;
}

export function MobileMatchCard({ match, version }: MobileMatchCardProps) {
  // Validar que match.matches existe
  if (!match.matches) {
    return null;
  }

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
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
            <Image
              src={getChampionImageUrl(match.champion_name, version)}
              alt={match.champion_name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

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
        <div className="mb-3 flex gap-1 justify-center w-14">
          {match.summoner1_id && (
            <div className="relative w-6 h-6 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(match.summoner1_id, version) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner1_id, version)}
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
              {getSummonerSpellUrl(match.summoner2_id, version) && (
                <Image
                  src={getSummonerSpellUrl(match.summoner2_id, version)}
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
                  src={getItemImageUrl(itemId, version)}
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

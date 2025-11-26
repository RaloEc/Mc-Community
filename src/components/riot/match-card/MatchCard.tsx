import Image from "next/image";
import Link from "next/link";
import { analyzeMatchTags, getTagsInfo } from "@/lib/riot/match-analyzer";
import { TeamPlayerList } from "./TeamPlayerList";
import {
  getChampionImageUrl,
  getItemImageUrl,
  getSummonerSpellUrl,
  getRuneIconUrl,
  getQueueName,
  formatDuration,
  getRelativeTime,
} from "./helpers";

interface RiotParticipant {
  teamId: number;
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
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
  riotIdGameName?: string;
  summonerName?: string;
}

interface PlayerSummaryData {
  championName: string;
  summoner1Id?: number;
  summoner2Id?: number;
  primaryRune?: number;
  secondaryRune?: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  label?: string;
}

interface PlayerSummaryProps {
  data: PlayerSummaryData;
  version: string;
  reverse?: boolean;
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

function PlayerSummarySection({
  data,
  version,
  reverse = false,
}: PlayerSummaryProps) {
  const avatarBlock = (
    <div className="flex flex-col items-center gap-1.5 w-[72px]">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-600">
        <Image
          src={getChampionImageUrl(data.championName, version)}
          alt={data.championName}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {(data.summoner1Id || data.summoner2Id) && (
        <div className="flex gap-1">
          {data.summoner1Id && (
            <div className="relative w-7 h-7 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(data.summoner1Id, version) && (
                <Image
                  src={getSummonerSpellUrl(data.summoner1Id, version)}
                  alt="Spell 1"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              )}
            </div>
          )}
          {data.summoner2Id && (
            <div className="relative w-7 h-7 rounded border border-slate-600 overflow-hidden bg-slate-800">
              {getSummonerSpellUrl(data.summoner2Id, version) && (
                <Image
                  src={getSummonerSpellUrl(data.summoner2Id, version)}
                  alt="Spell 2"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const runeBlock = (
    <div className={`flex flex-col gap-1.5 ${reverse ? "items-end" : ""}`}>
      {data.primaryRune && (
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-900">
          <Image
            src={getRuneIconUrl(data.primaryRune)}
            alt="Primary Rune"
            fill
            sizes="28px"
            className="object-cover p-0.5"
          />
        </div>
      )}
      {data.secondaryRune && (
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-900">
          <Image
            src={getRuneIconUrl(data.secondaryRune)}
            alt="Sub Rune"
            fill
            sizes="28px"
            className="object-cover p-0.5"
          />
        </div>
      )}
    </div>
  );

  const statsBlock = (
    <div
      className={`flex flex-col gap-1 ${reverse ? "items-end text-right" : ""}`}
    >
      {data.label && (
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          {data.label}
        </span>
      )}
      <div className="text-sm font-bold text-slate-100">
        {data.kills} / {data.deaths} / {data.assists}
      </div>
      <div className="text-xs text-slate-400 self-center text-center">
        {data.kda.toFixed(2)}
      </div>
    </div>
  );

  return (
    <div className="flex itemsolver gap-3">
      {reverse ? (
        <>
          {statsBlock}
          {runeBlock}
          {avatarBlock}
        </>
      ) : (
        <>
          {avatarBlock}
          {runeBlock}
          {statsBlock}
        </>
      )}
    </div>
  );
}

export interface Match {
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
  puuid: string;
  matches: {
    match_id: string;
    game_creation: number;
    game_duration: number;
    game_mode: string;
    queue_id: number;
    full_json?: any;
  };
}

interface MatchCardProps {
  match: Match;
  version: string;
  linkedAccountsMap?: Record<string, string>;
}

export function MatchCard({
  match,
  version,
  linkedAccountsMap = {},
}: MatchCardProps) {
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

  // Datos de jugadores
  const allParticipants = (match.matches?.full_json?.info?.participants ??
    []) as RiotParticipant[];
  const team1 = allParticipants
    .filter((p: any) => p.teamId === 100)
    .slice(0, 5);
  const team2 = allParticipants
    .filter((p: any) => p.teamId === 200)
    .slice(0, 5);

  const currentParticipant =
    allParticipants.find((p) => p.puuid === match.puuid) ?? null;
  const laneOpponentParticipant = findLaneOpponent(
    allParticipants,
    currentParticipant
  );

  const playerSummary: PlayerSummaryData = {
    championName: match.champion_name,
    summoner1Id: match.summoner1_id,
    summoner2Id: match.summoner2_id,
    primaryRune: match.perk_primary_style,
    secondaryRune: match.perk_sub_style,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    kda: match.kda,
    label: "Tú",
  };

  const opponentSummary: PlayerSummaryData | null = laneOpponentParticipant
    ? {
        championName: laneOpponentParticipant.championName,
        summoner1Id: laneOpponentParticipant.summoner1Id,
        summoner2Id: laneOpponentParticipant.summoner2Id,
        primaryRune: getParticipantRuneStyle(laneOpponentParticipant, 0),
        secondaryRune: getParticipantRuneStyle(laneOpponentParticipant, 1),
        kills: laneOpponentParticipant.kills ?? 0,
        deaths: laneOpponentParticipant.deaths ?? 0,
        assists: laneOpponentParticipant.assists ?? 0,
        kda: calculateKda(
          laneOpponentParticipant.kills,
          laneOpponentParticipant.deaths,
          laneOpponentParticipant.assists
        ),
        label: "Rival",
      }
    : null;

  return (
    <div className="block">
      {/* 
        Navega a /match/[matchId] que será interceptado por la ruta paralela
        en /perfil/@modal/(.)match/[matchId]/page.tsx, mostrando el detalle
        en un modal sin desmontar el historial de partidas
      */}
      <Link href={`/match/${match.match_id}`} className="block">
        <div
          className={`
          hidden md:grid grid-cols-[130px,auto,180px,90px,200px] items-center gap-3 p-3 rounded-lg border-l-4 transition-all hover:shadow-lg hover:border-l-8
          ${
            isVictory
              ? "border-l-green-500 bg-green-500/5 hover:bg-green-500/10"
              : "border-l-red-500 bg-red-500/5 hover:bg-red-500/10"
          }
        `}
        >
          {/* 1. Metadata */}
          <div className="flex flex-col gap-1">
            <span
              className={`text-xs font-bold ${
                isVictory ? "text-green-400" : "text-red-400"
              }`}
            >
              {isVictory ? "Victoria" : "Derrota"}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {getQueueName(match.matches.queue_id)}
            </span>
            <span className="text-[10px] text-slate-500">
              {formatDuration(match.matches.game_duration)}
            </span>
            <span className="text-[10px] text-slate-500">
              {getRelativeTime(match.created_at)}
            </span>
          </div>

          {/* 2. Champion summaries */}
          <div className="flex items-stretch gap-4">
            <div className="flex-1 min-w-0">
              <PlayerSummarySection data={playerSummary} version={version} />
            </div>
            {opponentSummary && (
              <>
                <div className="self-stretch w-px bg-slate-800/70" />
                <div className="flex-1 min-w-0">
                  <PlayerSummarySection
                    data={opponentSummary}
                    version={version}
                    reverse
                  />
                </div>
              </>
            )}
          </div>

          {/* 3. Items */}
          <div className="grid grid-cols-4 gap-1">
            {items.slice(0, 7).map((itemId, idx) => (
              <div
                key={idx}
                className="relative w-7 h-7 rounded border border-slate-600 overflow-hidden bg-slate-800"
              >
                {itemId !== 0 && (
                  <Image
                    src={getItemImageUrl(itemId, version)}
                    alt={`Item ${itemId}`}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>

          {/* 4. Stats */}
          <div className="flex flex-col gap-1 text-[10px]">
            <div>
              <span className="text-slate-500">Daño:</span>
              <span className="text-slate-300 ml-1 font-semibold">
                {(match.total_damage_dealt / 1000).toFixed(1)}k
              </span>
            </div>
            <div>
              <span className="text-slate-500">Oro:</span>
              <span className="text-slate-300 ml-1 font-semibold">
                {(match.gold_earned / 1000).toFixed(1)}k
              </span>
            </div>
            <div>
              <span className="text-slate-500">Visión:</span>
              <span className="text-slate-300 ml-1 font-semibold">
                {match.vision_score}
              </span>
            </div>
          </div>

          {/* 5. Teams (HORIZONTAL - lado a lado) */}
          <div className="flex gap-2">
            {team1.length > 0 && (
              <div className="flex-1">
                <TeamPlayerList
                  players={team1}
                  currentPuuid={match.puuid}
                  version={version}
                  linkedAccountsMap={linkedAccountsMap}
                />
              </div>
            )}
            {team2.length > 0 && (
              <div className="flex-1">
                <TeamPlayerList
                  players={team2}
                  currentPuuid={match.puuid}
                  version={version}
                  linkedAccountsMap={linkedAccountsMap}
                />
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

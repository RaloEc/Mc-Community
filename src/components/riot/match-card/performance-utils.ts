import { calculatePerformanceScore } from "@/lib/riot/match-analyzer";

export interface PerformanceParticipant {
  teamId?: number;
  puuid?: string;
  riotIdGameName?: string;
  summonerName?: string;
  championName?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  totalDamageDealtToChampions?: number;
  visionScore?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  teamPosition?: string | null;
  individualPosition?: string | null;
  role?: string | null;
  lane?: string | null;
  goldEarned?: number;
  objectivesStolen?: number;
  objectives_stolen?: number;
  win?: boolean;
}

interface TeamTotals {
  kills: number;
  damage: number;
  gold: number;
}

function buildTeamTotals(
  participants: PerformanceParticipant[]
): Record<number, TeamTotals> {
  return participants.reduce((acc, participant) => {
    const teamId = participant.teamId ?? 0;
    if (!acc[teamId]) {
      acc[teamId] = { kills: 0, damage: 0, gold: 0 };
    }
    acc[teamId].kills += participant.kills ?? 0;
    acc[teamId].damage += participant.totalDamageDealtToChampions ?? 0;
    acc[teamId].gold += participant.goldEarned ?? 0;
    return acc;
  }, {} as Record<number, TeamTotals>);
}

function buildTeamWinMap(matchInfo?: any): Record<number, boolean> {
  const teams = matchInfo?.teams ?? [];
  return teams.reduce((acc: Record<number, boolean>, team: any) => {
    if (typeof team?.teamId === "number") {
      acc[team.teamId] = Boolean(team.win);
    }
    return acc;
  }, {});
}

export function getParticipantKey(
  participant?: PerformanceParticipant | null
): string {
  if (!participant) {
    return "unknown";
  }

  return (
    participant.puuid ||
    `${participant.teamId ?? 0}-${
      participant.riotIdGameName ??
      participant.summonerName ??
      participant.championName ??
      "player"
    }`
  );
}

function getParticipantRole(
  participant: PerformanceParticipant
): string | null {
  return (
    participant.teamPosition ??
    participant.role ??
    participant.individualPosition ??
    participant.lane ??
    null
  );
}

export interface ParticipantScoreEntry {
  participant: PerformanceParticipant;
  score: number;
  key: string;
}

export function computeParticipantScores(
  participants: PerformanceParticipant[],
  gameDuration: number,
  matchInfo?: any
): ParticipantScoreEntry[] {
  const normalizedDuration = Math.max(0, gameDuration || 0);
  const teamTotals = buildTeamTotals(participants);
  const teamWinMap = buildTeamWinMap(matchInfo);

  return participants.map((participant) => {
    const teamId = participant.teamId ?? 0;
    const totals = teamTotals[teamId] ?? { kills: 0, damage: 0, gold: 0 };

    const score = calculatePerformanceScore({
      kills: participant.kills ?? 0,
      deaths: participant.deaths ?? 0,
      assists: participant.assists ?? 0,
      win: participant.win ?? teamWinMap[teamId] ?? false,
      gameDuration: normalizedDuration,
      goldEarned: participant.goldEarned ?? 0,
      totalDamageDealtToChampions: participant.totalDamageDealtToChampions ?? 0,
      visionScore: participant.visionScore ?? 0,
      totalMinionsKilled: participant.totalMinionsKilled ?? 0,
      neutralMinionsKilled: participant.neutralMinionsKilled ?? 0,
      role: getParticipantRole(participant),
      teamTotalKills: totals.kills,
      teamTotalDamage: totals.damage,
      teamTotalGold: totals.gold,
      objectivesStolen:
        participant.objectivesStolen ?? participant.objectives_stolen ?? 0,
    });

    return {
      participant,
      score,
      key: getParticipantKey(participant),
    };
  });
}

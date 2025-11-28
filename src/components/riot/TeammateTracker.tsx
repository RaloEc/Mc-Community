"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import type { Match } from "./match-card/MatchCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiotParticipant {
  puuid: string;
  teamId: number;
  riotIdGameName?: string;
  summonerName?: string;
}

export interface FrequentTeammate {
  puuid: string;
  name: string;
  gamesTogether: number;
}

export function getFrequentTeammates(
  matches: Match[],
  currentPuuid: string
): FrequentTeammate[] {
  if (!Array.isArray(matches) || !currentPuuid) {
    return [];
  }

  const teammateMap = new Map<string, FrequentTeammate>();
  const recentMatches = matches.slice(0, 50);

  for (const match of recentMatches) {
    const participants =
      ((match.matches?.full_json?.info?.participants ??
        []) as RiotParticipant[]) || [];

    const currentParticipant = participants.find(
      (participant) => participant.puuid === currentPuuid
    );

    if (!currentParticipant) {
      continue;
    }

    const teammates = participants.filter(
      (participant) =>
        participant.teamId === currentParticipant.teamId &&
        participant.puuid !== currentPuuid
    );

    for (const teammate of teammates) {
      const displayName =
        teammate.riotIdGameName ||
        teammate.summonerName ||
        "Jugador desconocido";

      const existing = teammateMap.get(teammate.puuid);

      if (existing) {
        existing.gamesTogether += 1;
      } else {
        teammateMap.set(teammate.puuid, {
          puuid: teammate.puuid,
          name: displayName,
          gamesTogether: 1,
        });
      }
    }
  }

  return Array.from(teammateMap.values()).sort(
    (a, b) => b.gamesTogether - a.gamesTogether
  );
}

interface TeammateTrackerProps {
  matches: Match[];
  currentPuuid: string;
  minGames?: number;
  className?: string;
}

export function TeammateTracker({
  matches,
  currentPuuid,
  minGames = 5,
  className = "",
}: TeammateTrackerProps) {
  const teammates = useMemo(() => {
    return getFrequentTeammates(matches, currentPuuid).filter(
      (teammate) => teammate.gamesTogether >= minGames
    );
  }, [matches, currentPuuid, minGames]);

  if (teammates.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center rounded-full p-1.5 text-slate-900 dark:text-slate-200 transition-colors hover:text-black dark:hover:text-white ${className}`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/60 text-slate-800 dark:text-slate-100 backdrop-blur-sm">
          <div className="flex flex-col gap-1 text-xs text-center">
            {teammates.map((teammate) => (
              <div key={teammate.puuid}>
                <span className="text-slate-700 dark:text-slate-200">
                  {teammate.name}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

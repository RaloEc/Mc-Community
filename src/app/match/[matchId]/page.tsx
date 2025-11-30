import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { getMatchById, getMatchTimeline } from "@/lib/riot/matches";
import { MatchDeathMap } from "@/components/riot/MatchDeathMap";
import { MatchAnalysis } from "@/components/riot/analysis/MatchAnalysis";
import { ScoreboardTable } from "@/components/riot/ScoreboardTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getChampionImg,
  getItemImg,
  formatGameVersion,
} from "@/lib/riot/helpers";
import { createClient } from "@/lib/supabase/server";

// Helper to format duration
function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Helper to format time ago
function formatTimeAgo(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `Hace ${days} días`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `Hace ${hours} horas`;
  return "Hace poco";
}

export async function generateMetadata({
  params,
}: {
  params: { matchId: string };
}): Promise<Metadata> {
  const matchId = params.matchId;
  const data = await getMatchById(matchId);

  if (!data) {
    return { title: "Partida no encontrada | KoreStats" };
  }

  const { match } = data;
  const mode = match.game_mode || "Partida";

  return {
    title: `${mode} - ${formatDuration(match.game_duration)} | KoreStats`,
    description: `Detalles de la partida ${matchId} en KoreStats`,
  };
}

export default async function MatchPage({
  params,
}: {
  params: { matchId: string };
}) {
  const { matchId } = params;
  const region = matchId.split("_")[0].toLowerCase();

  // Parallel fetch
  const [matchData, timeline] = await Promise.all([
    getMatchById(matchId),
    getMatchTimeline(matchId, region, process.env.RIOT_API_KEY!),
  ]);

  if (!matchData) {
    notFound();
  }

  const { match, participants } = matchData;
  const gameVersion = match.full_json?.info?.gameVersion || match.game_version;
  const mapParticipants = match.full_json?.info?.participants || [];

  // Get current user session to find linked account
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.debug("[MatchPage] Session obtenida:", {
    userId: session?.user?.id,
    email: session?.user?.email,
  });

  let currentUserPuuid = undefined;
  let currentUserGameName = undefined;
  let currentUserTagLine = undefined;

  if (session?.user) {
    const { data: riotAccount, error: accountError } = await supabase
      .from("linked_accounts_riot")
      .select("puuid, game_name, tag_line")
      .eq("user_id", session.user.id)
      .single();

    console.debug("[MatchPage] Búsqueda de cuenta Riot:", {
      userId: session.user.id,
      encontrada: !!riotAccount,
      error: accountError?.message,
      riotAccount: riotAccount
        ? {
            puuid: riotAccount.puuid,
            game_name: riotAccount.game_name,
            tag_line: riotAccount.tag_line,
          }
        : null,
    });

    if (riotAccount) {
      currentUserPuuid = riotAccount.puuid;
      currentUserGameName = riotAccount.game_name;
      currentUserTagLine = riotAccount.tag_line;
    }
  }

  const normalize = (value?: string) => (value ?? "").trim().toLowerCase();
  const normalizedUserGameName = normalize(currentUserGameName);
  const normalizedUserTag = normalize(currentUserTagLine);

  const focusParticipant = mapParticipants.find((p: any) => {
    if (currentUserPuuid && p.puuid === currentUserPuuid) {
      return true;
    }

    if (!normalizedUserGameName || !normalizedUserTag) {
      return false;
    }

    const participantGameName = normalize(
      p.riotIdGameName || p.gameName || p.summonerName
    );
    const participantTag = normalize(p.riotIdTagline || p.tagLine);

    return (
      participantGameName === normalizedUserGameName &&
      participantTag === normalizedUserTag
    );
  });
  const focusTeamId =
    focusParticipant?.teamId || mapParticipants[0]?.teamId || 100;
  const highlightParticipantId = focusParticipant?.participantId;

  console.debug("[MatchPage] Jugador enfocado", {
    currentUserPuuid,
    currentUserGameName,
    currentUserTagLine,
    focusParticipantId: focusParticipant?.participantId,
    focusTeamId,
  });

  const team1 = participants.filter((p: any) => p.win);
  const team2 = participants.filter((p: any) => !p.win);

  const team1Kills = team1.reduce((acc: number, p: any) => acc + p.kills, 0);
  const team2Kills = team2.reduce((acc: number, p: any) => acc + p.kills, 0);
  const team1Gold = team1.reduce(
    (acc: number, p: any) => acc + p.gold_earned,
    0
  );
  const team2Gold = team2.reduce(
    (acc: number, p: any) => acc + p.gold_earned,
    0
  );

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/perfil?tab=lol">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {match.game_mode}
            <span className="text-slate-500 text-base font-normal">
              • {formatDuration(match.game_duration)}
            </span>
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Calendar className="w-3 h-3" />{" "}
            {formatTimeAgo(match.game_creation)}
            <span className="text-slate-600">|</span>
            ID: {matchId}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scoreboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="map">Mapa</TabsTrigger>
        </TabsList>

        {/* Scoreboard Tab */}
        <TabsContent value="scoreboard" className="mt-6">
          <ScoreboardTable
            participants={participants}
            currentUserPuuid={currentUserPuuid}
            gameVersion={gameVersion}
            gameDuration={match.game_duration}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="mt-6">
          <MatchAnalysis
            match={match}
            timeline={timeline}
            currentUserPuuid={currentUserPuuid}
          />
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-6">
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-500" />
                Mapa de Muertes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <MatchDeathMap
                timeline={timeline}
                participants={mapParticipants}
                focusTeamId={focusTeamId}
                highlightParticipantId={highlightParticipantId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

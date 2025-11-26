"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { getMatchById, getMatchTimeline } from "@/lib/riot/matches";
import { MatchDeathMap } from "@/components/riot/MatchDeathMap";
import { MatchAnalysis } from "@/components/riot/analysis/MatchAnalysis";
import { ScoreboardTable } from "@/components/riot/ScoreboardTable";
import { createClient } from "@/lib/supabase/client";

interface MatchDetailContentProps {
  matchId: string;
}

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

/**
 * Componente que renderiza el contenido detallado de una partida
 * Usado tanto en la página completa como en el modal interceptado
 */
export function MatchDetailContent({ matchId }: MatchDetailContentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [currentUserPuuid, setCurrentUserPuuid] = useState<
    string | undefined
  >();

  useEffect(() => {
    const loadMatchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos de la partida
        const data = await getMatchById(matchId);
        if (!data) {
          setError("Partida no encontrada");
          return;
        }

        setMatchData(data);

        // Obtener timeline
        const region = matchId.split("_")[0].toLowerCase();
        const timelineData = await getMatchTimeline(
          matchId,
          region,
          process.env.NEXT_PUBLIC_RIOT_API_KEY || ""
        );
        setTimeline(timelineData);

        // Obtener PUUID del usuario actual
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: riotAccount } = await supabase
            .from("linked_accounts_riot")
            .select("puuid")
            .eq("user_id", session.user.id)
            .single();

          if (riotAccount) {
            setCurrentUserPuuid(riotAccount.puuid);
          }
        }
      } catch (err) {
        console.error("[MatchDetailContent] Error loading match:", err);
        setError("Error al cargar los detalles de la partida");
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {error}
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400">
        No se encontraron datos de la partida
      </div>
    );
  }

  const { match, participants } = matchData;
  const gameVersion = match.full_json?.info?.gameVersion || match.game_version;
  const mapParticipants = match.full_json?.info?.participants || [];

  const team1 = participants.filter((p: any) => p.win);
  const team2 = participants.filter((p: any) => !p.win);

  const focusParticipant = mapParticipants.find(
    (p: any) => p.puuid === currentUserPuuid
  );
  const focusTeamId =
    focusParticipant?.teamId || mapParticipants[0]?.teamId || 100;
  const highlightParticipantId = focusParticipant?.participantId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {match.game_mode}
          <span className="text-slate-500 text-base font-normal">
            • {formatDuration(match.game_duration)}
          </span>
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          {formatTimeAgo(match.game_creation)} • ID: {matchId}
        </p>
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

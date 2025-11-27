"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScoreboardTable } from "@/components/riot/ScoreboardTable";
import { createClient } from "@/lib/supabase/client";

interface ScoreboardModalProps {
  matchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal que muestra únicamente el scoreboard de una partida
 * Con botones para ver análisis completo o cerrar
 */
export function ScoreboardModal({
  matchId,
  open,
  onOpenChange,
}: ScoreboardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [currentUserPuuid, setCurrentUserPuuid] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (!open) return;

    const loadMatchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos de la partida desde la API
        const response = await fetch(`/api/riot/matches/${matchId}`);
        if (!response.ok) {
          setError("Partida no encontrada");
          return;
        }

        const data = await response.json();
        setMatchData(data);

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
        console.error("[ScoreboardModal] Error loading match:", err);
        setError("Error al cargar los detalles de la partida");
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchId, open]);

  const handleViewAnalysis = () => {
    onOpenChange(false);
    router.push(`/match/${matchId}`);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!matchData && !loading && !error) {
    return null;
  }

  const { match, participants } = matchData || {};
  const gameVersion =
    match?.full_json?.info?.gameVersion || match?.game_version;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[1400px] md:min-w-[1100px] bg-white text-slate-900 border-slate-200 dark:bg-black dark:text-white dark:border-slate-800">
        <DialogHeader className="sticky top-0 z-10 bg-white text-slate-900 pb-4 border-b border-slate-200 dark:bg-black dark:text-white dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Scoreboard</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Scoreboard de la partida con estadísticas de los jugadores
          </DialogDescription>
        </DialogHeader>

        {/* Contenido */}
        <div className="px-6 pb-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && matchData && (
            <>
              <ScoreboardTable
                participants={participants}
                currentUserPuuid={currentUserPuuid}
                gameVersion={gameVersion}
              />

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end mt-8 pt-0">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={handleViewAnalysis}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ver análisis
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ShareMatchResponse {
  success: boolean;
  message: string;
  entryId?: string;
}

export const useShareMatch = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [sharedMatches, setSharedMatches] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const shareMatch = async (
    matchId: string,
    comment?: string
  ): Promise<boolean> => {
    if (sharedMatches.includes(matchId)) {
      toast.info("Esta partida ya fue compartida");
      return false;
    }

    setIsSharing(true);
    try {
      const response = await fetch("/api/riot/matches/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          comment,
        }),
      });

      const data: ShareMatchResponse = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.info(data.message);
          setSharedMatches((prev) => [...prev, matchId]);
          return false;
        }
        throw new Error(data.message || "Error al compartir la partida");
      }

      setSharedMatches((prev) => [...prev, matchId]);
      toast.success(data.message);

      // Invalidar caché del perfil para refrescar las partidas compartidas
      queryClient.invalidateQueries({ queryKey: ["perfil"] });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareMatch,
    isSharing,
    sharedMatches,
  };
};

"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useUnifiedRiotSync } from "@/hooks/use-unified-riot-sync";

interface UnifiedRiotSyncButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg" | "icon";
  showLabel?: boolean;
  userColor?: string;
}

/**
 * Botón unificado que sincroniza tanto la cuenta de Riot como el historial de partidas
 * Reemplaza los dos botones individuales de RiotAccountCard y MatchHistoryList
 */
export function UnifiedRiotSyncButton({
  variant = "outline",
  size = "sm",
  showLabel = true,
  userColor,
}: UnifiedRiotSyncButtonProps) {
  const { sync, isPending, cooldownSeconds, isOnCooldown } =
    useUnifiedRiotSync();

  const handleClick = () => {
    sync();
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending || isOnCooldown}
      variant={variant}
      size={size}
      style={
        userColor && variant === "outline"
          ? {
              borderColor: userColor,
              color: isPending ? "#0f172a" : undefined,
              backgroundColor: isPending ? `${userColor}33` : undefined,
            }
          : undefined
      }
      className="flex items-center gap-2"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && "Sincronizando..."}
        </>
      ) : isOnCooldown ? (
        <>
          <RefreshCw className="h-4 w-4" />
          {showLabel && `Espera ${cooldownSeconds}s`}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          {showLabel && "Actualizar Todo"}
        </>
      )}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RiotLoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

/**
 * Botón para vincular cuenta de Riot Games
 *
 * Redirige a /api/riot/login que inicia el flujo OAuth 2.0
 */
export function RiotLoginButton({
  className,
  variant = "default",
  size = "default",
  fullWidth = false,
}: RiotLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      // Redirigir a /api/riot/login
      window.location.href = "/api/riot/login";
    } catch (error) {
      console.error("[RiotLoginButton] Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`${fullWidth ? "w-full" : ""} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <img
            src="https://raw.githubusercontent.com/Peterbe/awesome-game-development/master/assets/riot-games-logo.png"
            alt="Riot Games"
            className="mr-2 h-4 w-4"
          />
          Vincular Cuenta de Riot
        </>
      )}
    </Button>
  );
}

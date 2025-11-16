"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserTheme } from "@/hooks/useUserTheme";

type VotacionProps = {
  id: string;
  tipo: "hilo" | "comentario" | "noticia";
  votosIniciales?: number;
  vertical?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
};

export function Votacion({
  id,
  tipo,
  votosIniciales = 0,
  vertical = false,
  size = "md",
  className = "",
}: VotacionProps) {
  const { user } = useAuth();
  const { userColor } = useUserTheme();
  const [votos, setVotos] = useState(votosIniciales);
  const [miVoto, setMiVoto] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tamaños para los iconos
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Escala adicional cuando hay voto activo
  const activeScaleBySize = {
    sm: "scale-125",
    md: "scale-125",
    lg: "scale-125",
  } as const;

  // Actualizar votos cuando cambien desde el padre (para sincronización en tiempo real)
  useEffect(() => {
    setVotos(votosIniciales);
  }, [votosIniciales]);

  // Cargar el voto del usuario al montar el componente
  useEffect(() => {
    const cargarMiVoto = async () => {
      if (!user?.id) return;

      try {
        // Construir la URL correcta según el tipo
        let url = "";
        if (tipo === "comentario") {
          url = `/api/noticias/comentario/${id}/votar`;
        } else {
          url = `/api/foro/${tipo}/${id}/votar`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setMiVoto(data.userVote);
          setVotos(data.total);
        }
      } catch (error) {
        console.error("Error al cargar el voto:", error);
      }
    };

    cargarMiVoto();
  }, [id, tipo, user?.id]);

  const manejarVoto = async (e: React.MouseEvent, valor: number) => {
    e.preventDefault(); // Prevenir el comportamiento predeterminado
    e.stopPropagation(); // Detener la propagación

    if (!user) {
      alert("Debes iniciar sesión para votar");
      return;
    }

    if (isLoading) return; // Prevenir múltiples clicks

    setIsLoading(true);
    const valorNuevo = miVoto === valor ? 0 : valor;

    // Actualización optimista
    const votoAnterior = miVoto || 0;
    const nuevoTotal =
      votos - votoAnterior + (votoAnterior === valor ? 0 : valor);
    setMiVoto(votoAnterior === valor ? null : valor);
    setVotos(nuevoTotal);

    try {
      // Construir la URL correcta según el tipo
      let url = "";
      if (tipo === "comentario") {
        url = `/api/noticias/comentario/${id}/votar`;
      } else {
        url = `/api/foro/${tipo}/${id}/votar`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: valorNuevo }),
      });

      if (!res.ok) {
        throw new Error("Error al registrar el voto");
      }

      const data = await res.json();
      setVotos(data.total);
      setMiVoto(data.userVote);

      // No forzar navegación ni revalidación - dejar que React Query maneje el estado
    } catch (error) {
      console.error("Error al votar:", error);
      // Revertir en caso de error
      setVotos(votos);
      setMiVoto(votoAnterior === 0 ? null : votoAnterior);

      // Mensaje de error más amigable
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      if (!errorMessage.includes("ChunkLoadError")) {
        alert("No se pudo registrar tu voto. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-medium",
  }[size];

  return (
    <div
      className={`flex ${
        vertical ? "flex-col" : "flex-row items-center"
      } bg-gray-100 dark:bg-gray-800 ${
        vertical ? "rounded-lg" : "rounded-full"
      } p-0.5 ${className}`}
    >
      {/* Botón de voto negativo (abajo en vertical, izquierda en horizontal) */}
      <button
        onClick={(e) => manejarVoto(e, -1)}
        disabled={isLoading}
        className={`p-1.5 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors ${
          miVoto === -1 ? "text-current" : "text-gray-500 dark:text-gray-400"
        } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        style={miVoto === -1 ? { color: userColor } : undefined}
        aria-label="Votar negativo"
        aria-pressed={miVoto === -1}
      >
        <Minus className="h-3 w-3" strokeWidth={miVoto === -1 ? 2.5 : 2} />
      </button>

      {/* Contador de votos */}
      <div
        className={`${
          vertical ? "py-0.5" : "px-1"
        } font-bold text-sm min-w-[24px] text-center ${
          miVoto !== null ? "text-current" : "text-gray-500 dark:text-gray-400"
        }`}
        style={miVoto !== null ? { color: userColor } : undefined}
        aria-live="polite"
        aria-atomic="true"
      >
        {votos}
      </div>

      {/* Botón de voto positivo (arriba en vertical, derecha en horizontal) */}
      <button
        onClick={(e) => manejarVoto(e, 1)}
        disabled={isLoading}
        className={`p-1.5 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors ${
          miVoto === 1 ? "text-current" : "text-gray-500 dark:text-gray-400"
        } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        style={miVoto === 1 ? { color: userColor } : undefined}
        aria-label="Votar positivo"
        aria-pressed={miVoto === 1}
      >
        <Plus className="h-3 w-3" strokeWidth={miVoto === 1 ? 2.5 : 2} />
      </button>
    </div>
  );
}

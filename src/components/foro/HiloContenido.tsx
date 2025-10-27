"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { HighlightedContent } from "@/components/ui/HighlightedContent";
import dynamic from "next/dynamic";
import { useRealtimeVotosHilos } from "@/hooks/useRealtimeVotosHilos";
import { useUserTheme } from "@/hooks/useUserTheme";
import { toast } from "sonner";
import { WeaponStatsCard } from "@/components/weapon/WeaponStatsCard";
import type { WeaponStats } from "@/app/api/analyze-weapon/route";

// Cargar dinámicamente el componente YoutubePlayer para evitar problemas de hidratación
const YoutubePlayer = dynamic<{
  videoId: string;
  title?: string;
  className?: string;
}>(
  () =>
    import("@/components/ui/YoutubePlayer").then((mod) => mod.YoutubePlayer),
  {
    ssr: false,
    loading: () => (
      <div
        className="youtube-placeholder w-full bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{
          aspectRatio: "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="animate-pulse text-gray-400">Cargando video...</div>
      </div>
    ),
  }
);

interface HiloContenidoProps {
  html: string;
  className?: string;
  weaponStatsRecord?: {
    id: string;
    weapon_name: string | null;
    stats: WeaponStats;
  } | null;
}

// Extraer el ID de video de YouTube de una URL
const getYoutubeVideoId = (url: string): string | null => {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Componente para renderizar contenido HTML con soporte optimizado para videos de YouTube
 */
export default function HiloContenido({
  html,
  className = "",
  weaponStatsRecord,
}: HiloContenidoProps) {
  const [isClient, setIsClient] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { userColor } = useUserTheme();
  const [processedContent, setProcessedContent] = useState(html);
  const [weaponStatsBlocks, setWeaponStatsBlocks] = useState<WeaponStats[]>(() => {
    if (weaponStatsRecord?.stats) {
      return [weaponStatsRecord.stats];
    }
    return [];
  });
  const [youtubeEmbedNode, setYoutubeEmbedNode] = useState<ReactNode>(null);

  // Activar sincronización en tiempo real de votos de hilos
  useRealtimeVotosHilos();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Manejar clics en elementos con data-click-to-copy
  useEffect(() => {
    const handleClickToCopy = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const copyableElement = target.closest('[data-click-to-copy="true"]');

      if (copyableElement) {
        event.preventDefault();
        event.stopPropagation();

        const textToCopy = (copyableElement as HTMLElement).innerText;

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            toast.success('¡Texto copiado al portapapeles!', {
              duration: 2000,
            });
          })
          .catch((err) => {
            console.error('Error al copiar texto: ', err);
            toast.error('No se pudo copiar el texto.');
          });
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('click', handleClickToCopy);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('click', handleClickToCopy);
      }
    };
  }, [isClient, html]);

  useEffect(() => {
    if (!isClient || typeof document === "undefined") {
      return;
    }

    const workingDiv = document.createElement("div");
    workingDiv.innerHTML = html;

    // Extraer posible iframe de YouTube
    const iframe = workingDiv.querySelector("iframe");
    if (iframe) {
      const src = iframe.getAttribute("src") || "";
      const videoId = getYoutubeVideoId(src);

      if (videoId) {
        setYoutubeEmbedNode(
          <YoutubePlayer
            videoId={videoId}
            title="Video de YouTube"
            className="mb-4"
          />
        );
      } else {
        setYoutubeEmbedNode(null);
      }

      iframe.remove();
    } else {
      setYoutubeEmbedNode(null);
    }

    // Si ya tenemos estadísticas asociadas al hilo, evitar volver a insertarlas
    const statsList: WeaponStats[] = weaponStatsRecord?.stats
      ? [weaponStatsRecord.stats]
      : [];

    const blocks = weaponStatsRecord?.stats
      ? []
      : Array.from(
          workingDiv.querySelectorAll<HTMLDivElement>("[data-weapon-stats]")
        );

    blocks.forEach((block) => {
      const dataAttr = block.getAttribute("data-weapon-stats");
      if (!dataAttr) return;

      try {
        const parsed = JSON.parse(decodeURIComponent(dataAttr)) as WeaponStats;
        statsList.push(parsed);
      } catch (error) {
        console.error("No se pudieron parsear las estadísticas del arma:", error);
      }

      block.remove();
    });

    setWeaponStatsBlocks(statsList);
    setProcessedContent(workingDiv.innerHTML || "");
  }, [isClient, html]);

  // No renderizar nada en el servidor para evitar problemas de hidratación
  if (!isClient) {
    return (
      <div className={className}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className} 
      ref={contentRef}
      style={{
        '--user-color': userColor,
      } as React.CSSProperties}
    >
      {youtubeEmbedNode && <div className="mb-4">{youtubeEmbedNode}</div>}
      {processedContent && (
        <HighlightedContent
          html={processedContent}
          className="prose prose-sm max-w-none dark:prose-invert amoled:prose-invert amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)]"
        />
      )}
      {weaponStatsBlocks.length > 0 && (
        <div className="mt-4 space-y-4">
          {weaponStatsBlocks.map((stats, index) => (
            <WeaponStatsCard key={index} stats={stats} className="max-w-sm" />
          ))}
        </div>
      )}
    </div>
  );
}

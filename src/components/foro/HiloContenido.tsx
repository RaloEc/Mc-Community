"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRealtimeVotosHilos } from "@/hooks/useRealtimeVotosHilos";

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
}: HiloContenidoProps) {
  const [isClient, setIsClient] = useState(false);

  // Activar sincronización en tiempo real de votos de hilos
  useRealtimeVotosHilos();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Extraer el iframe de YouTube del HTML
  const extractYoutubeIframe = (content: string) => {
    if (!content) return null;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    const iframe = tempDiv.querySelector("iframe");
    if (!iframe) return null;

    const src = iframe.getAttribute("src") || "";
    const videoId = getYoutubeVideoId(src);

    if (!videoId) return null;

    return (
      <YoutubePlayer
        videoId={videoId}
        title="Video de YouTube"
        className="mb-4"
      />
    );
  };

  // Extraer el contenido sin el iframe de YouTube
  const getContentWithoutYoutube = (content: string) => {
    if (!content) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    // Eliminar el iframe de YouTube si existe
    const iframe = tempDiv.querySelector("iframe");
    if (iframe) {
      iframe.remove();
    }

    return tempDiv.innerHTML;
  };

  const youtubeEmbed = extractYoutubeIframe(html);
  const contentWithoutYoutube = getContentWithoutYoutube(html);

  return (
    <div className={className}>
      {youtubeEmbed && <div className="mb-4">{youtubeEmbed}</div>}
      {contentWithoutYoutube && (
        <div
          className="prose prose-sm max-w-none dark:prose-invert amoled:prose-invert amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)]"
          dangerouslySetInnerHTML={{ __html: contentWithoutYoutube }}
        />
      )}
    </div>
  );
}

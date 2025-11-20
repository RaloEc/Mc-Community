"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface YouTubeLazyProps {
  videoId: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Componente optimizado para cargar videos de YouTube con Lazy Load Facade
 *
 * Beneficios:
 * - No carga www-embed-player-pc.js hasta que el usuario haga clic
 * - Renderiza solo imagen miniatura inicialmente
 * - Reduce bloqueo del hilo principal en 3 segundos
 * - Mejora LCP y FID
 */
export function YouTubeLazy({
  videoId,
  title = "Video de YouTube",
  className = "",
  width = 1280,
  height = 720,
}: YouTubeLazyProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  const handlePlayClick = () => {
    setIsLoaded(true);
  };

  return (
    <div
      className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}
      style={{
        aspectRatio: "16 / 9",
      }}
    >
      {!isLoaded ? (
        <>
          {/* Miniatura de YouTube */}
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px"
            loading="lazy"
            priority={false}
          />

          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors duration-200" />

          {/* Botón de Play */}
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label={`Reproducir: ${title}`}
            type="button"
          >
            <div className="relative">
              {/* Círculo de fondo */}
              <div className="absolute inset-0 bg-red-600 rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-200 scale-100 group-hover:scale-110 transform" />

              {/* Icono de Play */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 md:w-20 md:h-20">
                <Play
                  className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </button>

          {/* Indicador de carga lazy */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Haz clic para reproducir
          </div>
        </>
      ) : (
        /* iframe de YouTube */
        <iframe
          src={youtubeUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Eye,
  TrendingUp,
  Clock,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  Code,
  Twitter,
  Youtube,
  AtSign,
  Sword,
} from "lucide-react";
import { Votacion } from "@/components/ui/Votacion";
import React from "react";
import { useUserTheme } from "@/hooks/useUserTheme";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { HighlightedContent } from "@/components/ui/HighlightedContent";
import { WeaponStatsCard } from "@/components/weapon/WeaponStatsCard";
import { HiloPreview } from "./HiloPreview";
import type { WeaponStats } from "@/types/weapon";

export type HiloCardProps = {
  id: string;
  href: string;
  titulo: string;
  contenido?: string | null;
  categoriaNombre?: string;
  categoriaColor?: string;
  autorUsername?: string;
  autorAvatarUrl?: string | null;
  autorId?: string | null;
  autorPublicId?: string | null;
  autorColor?: string;
  createdAt: string;
  vistas?: number;
  respuestas?: number;
  votosIniciales?: number;
  showSinRespuestasAlert?: boolean;
  className?: string;
  weaponStats?: WeaponStats | string | null;
  onDelete?: (hiloId: string) => void;
};

function stripHtml(text?: string | null, maxLen: number = 80): string {
  if (!text) return "";
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.substring(0, maxLen) + "..." : plain;
}

// Extraer el ID de video de YouTube de una URL
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Función pura para parsear weaponStats
const parseWeaponStats = (
  weaponStats: HiloCardProps["weaponStats"]
): WeaponStats | null => {
  if (!weaponStats) return null;

  // Si ya es un objeto (ha sido pasado así desde un contexto de React/servidor)
  if (typeof weaponStats !== "string") {
    return weaponStats;
  }

  // Intentar parsear el string
  try {
    const parsed = JSON.parse(weaponStats) as WeaponStats;
    // Asegurar que es un objeto válido y no simplemente 'null' como string
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error(
      "[HiloCard] Error al parsear weaponStats (JSON inválido):",
      error
    );
    return null;
  }
};

// Importar dinámicamente el componente YoutubePlayer para evitar problemas de hidratación
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

// Función para procesar tweets en el HTML
const processTweetsInHtml = (content: string): string => {
  if (!content) return content;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;

  // Buscar todos los tweets
  const twitterEmbeds = Array.from(
    tempDiv.querySelectorAll('[data-type="twitter-embed"]')
  );

  twitterEmbeds.forEach((embed) => {
    const twitterAttr = embed.getAttribute("data-twitter");
    if (twitterAttr) {
      try {
        const data = JSON.parse(twitterAttr);

        // Decodificar HTML si está en base64
        if (
          data.html &&
          typeof data.html === "string" &&
          data.html.length > 0
        ) {
          try {
            const decodedHtml = decodeURIComponent(escape(atob(data.html)));
            // Reemplazar el contenido del div con el HTML decodificado
            embed.innerHTML = `<div class="twitter-embed-content">${decodedHtml}</div>`;
          } catch (e) {
            console.error("[HiloCard] Error decodificando tweet:", e);
          }
        }
      } catch (e) {
        console.error("[HiloCard] Error parseando tweet:", e);
      }
    }
  });

  return tempDiv.innerHTML;
};

// Componente para renderizar contenido HTML con soporte para videos de YouTube e imágenes
const HtmlContentWithYoutube = React.memo(
  function HtmlContentWithYoutube({
    html,
    className = "",
  }: {
    html: string;
    className?: string;
  }) {
    const { userColor } = useUserTheme();

    // Procesar tweets en el HTML
    const processedHtml = React.useMemo(
      () => processTweetsInHtml(html),
      [html]
    );

    // Verificar si hay un video en el contenido
    const hasVideo = (content: string): boolean => {
      if (!content) return false;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      return tempDiv.querySelector("iframe") !== null;
    };

    // Extraer imágenes del HTML y optimizarlas con loading="lazy"
    const extractImages = (content: string): string[] => {
      if (!content) return [];
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      // Añadir loading="lazy" a todas las imágenes en el contenido
      const allImages = Array.from(tempDiv.querySelectorAll("img"));
      allImages.forEach((img) => {
        img.setAttribute("loading", "lazy");
        // También añadir decoding="async" para mejorar el rendimiento
        img.setAttribute("decoding", "async");
      });

      const pickBestSrc = (img: HTMLImageElement): string | null => {
        // Preferir data-fullsrc / data-original / data-src si existen
        const dataFull =
          img.getAttribute("data-fullsrc") ||
          img.getAttribute("data-full") ||
          img.getAttribute("data-original") ||
          img.getAttribute("data-src");
        if (dataFull) return dataFull;

        // Si hay srcset, elegir el candidato con mayor ancho
        const srcset = img.getAttribute("srcset");
        if (srcset) {
          const candidates = srcset
            .split(",")
            .map((s) => s.trim())
            .map((part) => {
              const [url, size] = part.split(" ").map((p) => p.trim());
              const width =
                size && size.endsWith("w")
                  ? parseInt(size)
                  : size && size.endsWith("x")
                  ? parseFloat(size) * 1000
                  : 0;
              return { url, width: isNaN(width) ? 0 : width };
            });
          const best = candidates.sort((a, b) => b.width - a.width)[0];
          if (best?.url) return best.url;
        }

        // Fallback al src normal
        return img.getAttribute("src");
      };

      return allImages
        .map((img) => pickBestSrc(img))
        .filter((src): src is string => Boolean(src));
    };

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

      // Usar el componente YoutubePlayer importado al nivel superior
      return <YoutubePlayer videoId={videoId} className="mb-4" />;
    };

    // Extraer el contenido sin el iframe de YouTube y sin imágenes si hay video
    const getContentWithoutMedias = (
      content: string,
      removeImages: boolean = false
    ) => {
      if (!content) return "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      // Eliminar el iframe de YouTube si existe
      const iframes = tempDiv.querySelectorAll("iframe");
      iframes.forEach((iframe) => iframe.remove());

      // Si hay que eliminar las imágenes (porque hay un video o múltiples imágenes)
      if (removeImages) {
        const images = tempDiv.querySelectorAll("img");
        images.forEach((img) => img.remove());
      }

      // Limpiar elementos vacíos que puedan haber quedado
      const emptyParagraphs = tempDiv.querySelectorAll("p:empty");
      emptyParagraphs.forEach((p) => p.remove());

      return tempDiv.innerHTML;
    };

    const youtubeEmbed = extractYoutubeIframe(processedHtml);
    const images = extractImages(processedHtml);
    const containsVideo = hasVideo(processedHtml);
    const imageCount = images.length;
    const containsMultipleImages = imageCount > 1;

    // Determinar si debemos eliminar las imágenes del contenido HTML
    // Evita duplicación: si hay al menos una imagen (o video), removemos las <img> del HTML base
    const shouldRemoveImages = containsVideo || imageCount > 0;
    const contentWithoutMedias = getContentWithoutMedias(
      processedHtml,
      shouldRemoveImages
    );

    // Verificar si hay contenido de texto después de eliminar medios
    const hasTextContent =
      contentWithoutMedias.replace(/<[^>]*>/g, "").trim().length > 0;

    return (
      <div className={className}>
        {/* Si hay video, mostrarlo primero */}
        {containsVideo && (
          <div
            className="mb-3 youtube-embed-container"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {youtubeEmbed}
          </div>
        )}

        {/* Si no hay video pero hay múltiples imágenes, mostrar galería */}
        {!containsVideo && containsMultipleImages && (
          <div className="mb-3 relative">
            <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {images.length}
            </div>
            <ImageGallery images={images} />
          </div>
        )}

        {/* Si no hay video ni múltiples imágenes, pero hay una sola imagen */}
        {!containsVideo && !containsMultipleImages && images.length === 1 && (
          <div className="mb-3 w-full flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden p-0">
                <img
                  src={images[0]}
                  alt="Imagen"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    margin: "0 0",
                    display: "inline-block",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mostrar el contenido de texto si existe */}
        {hasTextContent && (
          <div
            style={
              {
                "--user-color": userColor,
              } as React.CSSProperties
            }
          >
            <HighlightedContent
              html={contentWithoutMedias}
              className="prose prose-sm max-w-none dark:prose-invert"
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Memoización para evitar re-renderizados innecesarios
    if (!prevProps.html && !nextProps.html) return true;
    if (!prevProps.html || !nextProps.html) return false;

    // Si el contenido es exactamente igual, no re-renderizar
    if (prevProps.html === nextProps.html) return true;

    // Si la diferencia de longitud es pequeña, comparar más a fondo
    const lengthDiff = Math.abs(prevProps.html.length - nextProps.html.length);
    if (lengthDiff < 10) {
      // Verificar si ambos tienen o no tienen videos/imágenes
      const prevHasVideo = prevProps.html.includes("<iframe");
      const nextHasVideo = nextProps.html.includes("<iframe");
      const prevHasImg = prevProps.html.includes("<img");
      const nextHasImg = nextProps.html.includes("<img");

      return prevHasVideo === nextHasVideo && prevHasImg === nextHasImg;
    }

    // Si hay una diferencia significativa, re-renderizar
    return false;
  }
);

function HiloCard(props: HiloCardProps) {
  const {
    id,
    href,
    titulo,
    contenido,
    categoriaNombre,
    categoriaColor,
    autorUsername = "Anónimo",
    autorAvatarUrl,
    autorId,
    autorPublicId,
    autorColor,
    createdAt,
    vistas = 0,
    respuestas = 0,
    votosIniciales = 0,
    showSinRespuestasAlert = false,
    className = "",
    weaponStats,
    onDelete,
  } = props;

  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const isAuthor = user?.id === autorId;
  const router = useRouter();

  const normalizedUsername = autorUsername?.trim();
  const profileId = autorPublicId
    ? autorPublicId
    : normalizedUsername && normalizedUsername.toLowerCase() !== "anónimo"
    ? normalizedUsername
    : null;
  const hasProfileLink = Boolean(profileId);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("¿Estás seguro de que deseas eliminar este hilo?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/foro/hilos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el hilo");
      }

      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error("Error al eliminar hilo:", error);
      alert("No se pudo eliminar el hilo");
    } finally {
      setIsDeleting(false);
    }
  };

  const parsedWeaponStats = parseWeaponStats(weaponStats);

  const contentIndicators = React.useMemo(() => {
    // Importar Sword para el icono de arma
    // Este será usado en los indicadores de contenido
    if (!contenido || typeof document === "undefined") {
      return {
        hasCode: false,
        hasTweet: false,
        hasYoutube: false,
        hasImages: false,
        hasMentions: false,
        hasAny: false,
      };
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = contenido;

    const hasCode =
      tempDiv.querySelector("pre") !== null ||
      tempDiv.querySelector("code") !== null;
    const hasTweet =
      tempDiv.querySelector('[data-type="twitter-embed"]') !== null;
    const hasYoutube = Array.from(tempDiv.querySelectorAll("iframe")).some(
      (iframe) => {
        const src = iframe.getAttribute("src") ?? "";
        return /youtube\.com|youtu\.be/.test(src);
      }
    );
    const hasImages = tempDiv.querySelector("img") !== null;
    const hasMentions =
      tempDiv.querySelector(".editor-mention") !== null ||
      /@\w+/.test(tempDiv.textContent ?? "");

    return {
      hasCode,
      hasTweet,
      hasYoutube,
      hasImages,
      hasMentions,
      hasWeapon: parsedWeaponStats !== null,
      hasAny:
        hasCode ||
        hasTweet ||
        hasYoutube ||
        hasImages ||
        hasMentions ||
        parsedWeaponStats !== null,
    };
  }, [contenido, parsedWeaponStats]);

  const badgeBg = (categoriaColor || "#3B82F6") + "20";
  const badgeFg = categoriaColor || "#3B82F6";
  const { userColor, getFadedBackground, getColorWithOpacity } = useUserTheme();

  // Obtener el color de fondo atenuado
  const fadedBgColor = getFadedBackground();

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!hasProfileLink || !profileId) return;
    e.preventDefault();
    e.stopPropagation();
    router.push(`/perfil/${encodeURIComponent(profileId)}`);
  };

  const handleProfileKeyDown = (e: React.KeyboardEvent) => {
    if (!hasProfileLink || !profileId) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/perfil/${encodeURIComponent(profileId)}`);
    }
  };

  // Precargar datos del hilo al hacer hover - temporalmente desactivado
  const handleHiloHover = () => {
    // Función desactivada temporalmente
  };

  // Manejador de clics para la tarjeta
  const handleCardClick = (e: React.MouseEvent) => {
    // Si el clic proviene de un iframe (video de YouTube), no hacer nada
    const target = e.target as HTMLElement;
    if (
      target.closest("iframe") ||
      target.closest(".youtube-embed-container") ||
      target.closest(".image-gallery")
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <div className={`${className} block my-3`}>
      <Card
        className="group flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-xl"
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: userColor
            ? `${userColor}40`
            : "rgba(156, 163, 175, 0.5)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <Link
          href={href}
          className="block flex-1"
          onClick={handleCardClick}
          onMouseEnter={handleHiloHover}
        >
          <CardContent className="p-0 flex flex-col">
            <article className="flex flex-col">
              <div className="p-5 flex flex-col">
                {/* Fila de autor y categoría */}
                <div className="flex items-center justify-between mb-3">
                  {/* Autor */}
                  <div className="flex items-center gap-2">
                    <div
                      onClick={hasProfileLink ? handleProfileClick : undefined}
                      onKeyDown={hasProfileLink ? handleProfileKeyDown : undefined}
                      role={hasProfileLink ? "link" : undefined}
                      tabIndex={hasProfileLink ? 0 : -1}
                      aria-disabled={!hasProfileLink}
                      data-prevent-card-navigation="true"
                      className={`flex items-center gap-2 group/author ${
                        hasProfileLink
                          ? "cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          : "cursor-default"
                      }`}
                      title={
                        hasProfileLink
                          ? `Ver perfil de ${autorUsername}`
                          : "Autor no disponible"
                      }
                    >
                      <Avatar className="h-6 w-6 group-hover/author:ring-2 group-hover/author:ring-primary transition-all duration-200">
                        {autorAvatarUrl && (
                          <AvatarImage
                            src={autorAvatarUrl}
                            alt={autorUsername}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                          {autorUsername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center gap-1">
                        {autorUsername}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/author:opacity-100 transition-opacity duration-200" />
                      </span>
                    </div>
                  </div>

                  {/* Categoría */}
                  <div className="flex items-center gap-2">
                    {(categoriaNombre || contentIndicators.hasAny) && (
                      <div className="flex items-center gap-2">
                        {categoriaNombre && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                            style={{ backgroundColor: badgeBg, color: badgeFg }}
                          >
                            {categoriaNombre}
                          </Badge>
                        )}
                        {contentIndicators.hasAny && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            {contentIndicators.hasCode && (
                              <Code
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {contentIndicators.hasTweet && (
                              <Twitter
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {contentIndicators.hasYoutube && (
                              <Youtube
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {contentIndicators.hasImages && (
                              <ImageIcon
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {contentIndicators.hasMentions && (
                              <AtSign
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {contentIndicators.hasWeapon && (
                              <Sword
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {showSinRespuestasAlert && (
                      <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                    )}
                  </div>
                </div>

                {/* Título y extracto */}
                <div className="space-y-4 flex-1 flex flex-col">
                  <h3
                    className="font-semibold text-base text-gray-900 dark:text-white break-words whitespace-normal"
                    title={titulo.length > 80 ? titulo : undefined}
                  >
                    {titulo}
                  </h3>

                  {contenido && (
                    <div className="hilo-preview text-sm text-gray-600 dark:text-gray-400 flex-1">
                      <HiloPreview html={contenido || ""} />

                      {parsedWeaponStats && (
                        <div className="mb-4 md:flex md:justify-center">
                          <WeaponStatsCard
                            stats={parsedWeaponStats}
                            className="max-w-sm md:max-w-xl md:w-72 md:h-96  md:mx-auto  "
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Barra inferior con estadísticas */}
              <div
                className="border-t p-2 transition-colors duration-300 flex flex-wrap items-center gap-x-4 gap-y-2"
                style={{
                  borderColor: getColorWithOpacity(0.1),
                  backgroundColor: fadedBgColor,
                }}
              >
                {/* Izquierda: Vistas y comentarios */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Eye className="h-3 w-3" />
                    {vistas || 0}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-3 w-3" />
                    {respuestas || 0}
                  </span>
                </div>

                {/* Centro: Votos */}
                <div
                  className="order-last w-full flex justify-center sm:order-none sm:w-auto sm:flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Votacion
                    id={id}
                    tipo="hilo"
                    votosIniciales={votosIniciales}
                    vertical={false}
                    size="sm"
                    className="h-6"
                  />
                </div>

                {/* Derecha: Fecha y botón de eliminar */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {isAuthor && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                      title="Eliminar hilo"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}

// Función de comparación mejorada para memoización
const arePropsEqual = (
  prevProps: HiloCardProps,
  nextProps: HiloCardProps
): boolean => {
  // Comparación de propiedades principales que afectan al renderizado
  const basicPropsEqual =
    prevProps.id === nextProps.id &&
    prevProps.titulo === nextProps.titulo &&
    prevProps.votosIniciales === nextProps.votosIniciales &&
    prevProps.respuestas === nextProps.respuestas &&
    prevProps.vistas === nextProps.vistas;

  // Si las propiedades básicas son diferentes, definitivamente hay que re-renderizar
  if (!basicPropsEqual) return false;

  // Comparación de contenido solo si ambos tienen contenido
  // Si uno tiene contenido y el otro no, o si el contenido cambió, hay que re-renderizar
  if (prevProps.contenido || nextProps.contenido) {
    // Si uno tiene contenido y el otro no, son diferentes
    if (!prevProps.contenido || !nextProps.contenido) return false;

    // Si el contenido cambió significativamente (más de 10 caracteres de diferencia)
    // o si contiene diferentes videos/imágenes, hay que re-renderizar
    const prevHasVideo = prevProps.contenido?.includes("<iframe") || false;
    const nextHasVideo = nextProps.contenido?.includes("<iframe") || false;
    const prevHasImage = prevProps.contenido?.includes("<img") || false;
    const nextHasImage = nextProps.contenido?.includes("<img") || false;

    if (prevHasVideo !== nextHasVideo || prevHasImage !== nextHasImage)
      return false;

    // Si la longitud del contenido cambió significativamente, hay que re-renderizar
    const lengthDiff = Math.abs(
      (prevProps.contenido?.length || 0) - (nextProps.contenido?.length || 0)
    );
    if (lengthDiff > 10) return false;
  }

  // Comparación de otras propiedades que podrían afectar la apariencia
  if (prevProps.categoriaColor !== nextProps.categoriaColor) return false;
  if (prevProps.categoriaNombre !== nextProps.categoriaNombre) return false;
  if (prevProps.autorUsername !== nextProps.autorUsername) return false;
  if (prevProps.autorAvatarUrl !== nextProps.autorAvatarUrl) return false;
  if (prevProps.autorId !== nextProps.autorId) return false;
  if (prevProps.showSinRespuestasAlert !== nextProps.showSinRespuestasAlert)
    return false;
  if (prevProps.weaponStats !== nextProps.weaponStats) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;

  // Si todas las comparaciones pasaron, las props son iguales
  return true;
};

export default React.memo(HiloCard, arePropsEqual);

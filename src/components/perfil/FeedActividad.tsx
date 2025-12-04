"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  MessageSquare,
  Newspaper,
  Clock,
  Eye,
  MessageCircle,
  Image as ImageIcon,
  Code,
  Twitter,
  Youtube,
  AtSign,
  Crosshair,
  Trophy,
  Trash2,
} from "lucide-react";
import { ProfileData } from "@/hooks/use-perfil-usuario";
import { WeaponStatsCard } from "@/components/weapon/WeaponStatsCard";
import { SharedMatchCard } from "@/components/perfil/SharedMatchCard";
import React from "react";

interface FeedActividadProps {
  ultimosHilos: Array<{
    id: string;
    titulo: string;
    contenido: string;
    created_at: string;
    categoria_titulo: string;
    slug?: string;
    vistas: number;
    respuestas: number;
    hasWeaponStats: boolean;
  }>;
  ultimosPosts: ProfileData["ultimosPosts"];
  weaponStatsRecords: ProfileData["weaponStatsRecords"];
  ultimasPartidas?: Array<{
    id: string;
    matchId: string;
    championId: number;
    championName: string;
    role: string;
    lane: string;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
    totalCS: number;
    csPerMin: number;
    visionScore: number;
    damageToChampions: number;
    damageToTurrets: number;
    goldEarned: number;
    items: number[];
    summoner1Id: number;
    summoner2Id: number;
    perkPrimaryStyle: number;
    perkSubStyle: number;
    rankingPosition: number | null;
    performanceScore: number | null;
    result: "win" | "loss";
    queueId: number;
    gameDuration: number;
    gameCreation: number;
    dataVersion: string;
    tier: string | null;
    rank: string | null;
    leaguePoints: number;
    rankWins: number;
    rankLosses: number;
    comment: string | null;
    created_at: string;
  }>;
  userColor?: string;
  isOwnProfile?: boolean;
  onMatchDeleted?: () => void;
}

export const FeedActividad = ({
  ultimosHilos,
  ultimosPosts,
  weaponStatsRecords,
  ultimasPartidas,
  userColor = "#3b82f6",
  isOwnProfile = false,
  onMatchDeleted,
}: FeedActividadProps) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDeleteMatch = async (entryId: string) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar esta partida compartida?")
    ) {
      return;
    }

    setDeletingId(entryId);
    try {
      const response = await fetch("/api/user-activity/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar");
      }

      // Llamar callback para refrescar el feed
      onMatchDeleted?.();
    } catch (error) {
      console.error("[FeedActividad] Error deleting match:", error);
      alert("Error al eliminar la partida");
    } finally {
      setDeletingId(null);
    }
  };

  const colorStyle = {
    "--user-color": userColor,
  } as React.CSSProperties;

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diferencia = ahora.getTime() - date.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getContentIndicators = React.useMemo(() => {
    return (contenido: string) => {
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
        hasAny: hasCode || hasTweet || hasYoutube || hasImages || hasMentions,
      };
    };
  }, []);

  // Combinar hilos, posts, weapon stats y partidas en un feed unificado
  const feedItems = React.useMemo(() => {
    const items: Array<{
      type: "hilo" | "post" | "weapon" | "lol_match";
      id: string;
      fecha: string;
      data: any;
    }> = [];

    // Agregar hilos
    ultimosHilos?.forEach((hilo) => {
      items.push({
        type: "hilo",
        id: `hilo-${hilo.id}`,
        fecha: hilo.created_at,
        data: hilo,
      });
    });

    // Agregar posts
    ultimosPosts?.forEach((post) => {
      items.push({
        type: "post",
        id: `post-${post.id}`,
        fecha: post.created_at,
        data: post,
      });
    });

    // Agregar weapon stats
    weaponStatsRecords?.forEach((record) => {
      items.push({
        type: "weapon",
        id: `weapon-${record.id}`,
        fecha: record.created_at,
        data: record,
      });
    });

    // Agregar partidas compartidas
    ultimasPartidas?.forEach((partida) => {
      items.push({
        type: "lol_match",
        id: `match-${partida.id}`,
        fecha: partida.created_at,
        data: partida,
      });
    });

    // Ordenar por fecha descendente
    return items.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [ultimosHilos, ultimosPosts, weaponStatsRecords, ultimasPartidas]);

  if (feedItems.length === 0) {
    return (
      <Card className="transition-shadow hover:shadow-lg dark:border-gray-800">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sin actividad reciente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedItems.map((item) => {
        if (item.type === "hilo") {
          const hilo = item.data;
          const contenidoPlano = hilo.contenido.replace(/<[^>]*>/g, "");
          const indicators = getContentIndicators(hilo.contenido);

          return (
            <Card
              key={item.id}
              className="transition-shadow hover:shadow-lg dark:border-gray-800 overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/foro/hilos/${hilo.slug || hilo.id}`}
                        className="group"
                      >
                        <h3 className="text-base sm:text-lg font-semibold group-hover:underline line-clamp-2 text-foreground">
                          {hilo.titulo}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className="inline-block text-xs px-2 py-1 rounded-full text-foreground"
                          style={{
                            backgroundColor: `color-mix(in srgb, var(--user-color) 15%, transparent)`,
                            color: `var(--user-color)`,
                            ...colorStyle,
                          }}
                        >
                          {hilo.categoria_titulo}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatearFecha(hilo.created_at)}
                        </span>
                      </div>
                    </div>
                    <Newspaper
                      className="w-5 h-5 flex-shrink-0"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    />
                  </div>

                  {/* Contenido preview */}
                  <p className="text-sm text-muted-foreground line-clamp-5">
                    {contenidoPlano}
                  </p>

                  {/* Indicadores de contenido */}
                  {(indicators.hasAny || hilo.hasWeaponStats) && (
                    <div className="flex flex-wrap gap-2">
                      {indicators.hasCode && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Code className="w-3 h-3" />
                          <span>Código</span>
                        </div>
                      )}
                      {indicators.hasTweet && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Twitter className="w-3 h-3" />
                          <span>Tweet</span>
                        </div>
                      )}
                      {indicators.hasYoutube && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Youtube className="w-3 h-3" />
                          <span>Video</span>
                        </div>
                      )}
                      {indicators.hasImages && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon className="w-3 h-3" />
                          <span>Imágenes</span>
                        </div>
                      )}
                      {indicators.hasMentions && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AtSign className="w-3 h-3" />
                          <span>Menciones</span>
                        </div>
                      )}
                      {hilo.hasWeaponStats && (
                        <div
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                          style={{ color: `var(--user-color)`, ...colorStyle }}
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>Stats</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-2 border-t dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span>{hilo.vistas}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span>{hilo.respuestas}</span>
                    </div>
                    {hilo.hasWeaponStats && (
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: `var(--user-color)`, ...colorStyle }}
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>Armas</span>
                      </div>
                    )}
                    <Link
                      href={`/foro/hilos/${hilo.slug || hilo.id}`}
                      className="ml-auto flex items-center gap-1 text-xs hover:underline"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    >
                      Ver más
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        } else if (item.type === "post") {
          const post = item.data;

          return (
            <Card
              key={item.id}
              className="transition-shadow hover:shadow-lg dark:border-gray-800 overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/foro/hilos/${post.hilo_id}`}
                        className="group"
                      >
                        <h3 className="text-base sm:text-lg font-semibold group-hover:underline line-clamp-1 text-foreground">
                          Respuesta en: {post.hilo_titulo}
                        </h3>
                      </Link>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatearFecha(post.created_at)}
                      </span>
                    </div>
                    <MessageCircle
                      className="w-5 h-5 flex-shrink-0"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    />
                  </div>

                  {/* Contenido preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.contenido}
                  </p>

                  {/* Link */}
                  <div className="pt-2 border-t dark:border-gray-700">
                    <Link
                      href={`/foro/hilos/${post.hilo_id}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    >
                      Ver respuesta
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        } else if (item.type === "weapon") {
          const record = item.data;

          return (
            <Card
              key={item.id}
              className="transition-shadow hover:shadow-lg dark:border-gray-800 overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/foro/hilos/${
                          record.hilo.slug || record.hilo.id
                        }`}
                        className="group"
                      >
                        <h3 className="text-base sm:text-lg font-semibold group-hover:underline line-clamp-2 text-foreground">
                          {record.weapon_name
                            ? `${record.weapon_name} - ${record.hilo.titulo}`
                            : record.hilo.titulo}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className="inline-block text-xs px-2 py-1 rounded-full text-foreground"
                          style={{
                            backgroundColor: `color-mix(in srgb, var(--user-color) 15%, transparent)`,
                            color: `var(--user-color)`,
                            ...colorStyle,
                          }}
                        >
                          {record.hilo.categoria_titulo}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatearFecha(record.created_at)}
                        </span>
                      </div>
                    </div>
                    <Crosshair
                      className="w-5 h-5 flex-shrink-0"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    />
                  </div>

                  {/* Weapon Stats Card */}
                  {record.stats && (
                    <div className="mt-2">
                      <WeaponStatsCard
                        stats={record.stats}
                        className="max-w-full"
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-2 border-t dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span>{record.hilo.vistas}</span>
                    </div>
                    <Link
                      href={`/foro/hilos/${record.hilo.slug || record.hilo.id}`}
                      className="ml-auto flex items-center gap-1 text-xs hover:underline"
                      style={{
                        color: `var(--user-color)`,
                        ...colorStyle,
                      }}
                    >
                      Ver más
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        } else if (item.type === "lol_match") {
          const partida = item.data;

          return (
            <SharedMatchCard
              key={item.id}
              partida={partida}
              userColor={userColor}
              isOwnProfile={isOwnProfile}
              onDelete={handleDeleteMatch}
              deletingId={deletingId}
            />
          );
        }
      })}
    </div>
  );
};

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, MessageSquare, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WeaponStatsCard } from "@/components/weapon/WeaponStatsCard";
import type { ForoHiloRelacionado } from "@/types/foro";

interface HiloCarouselCardProps {
  hilo: ForoHiloRelacionado;
}

/**
 * Extrae la primera imagen del contenido HTML
 */
function extractFirstImage(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Extrae el primer párrafo de texto del contenido HTML
 */
function extractFirstParagraph(html: string): string {
  const textMatch = html.replace(/<[^>]*>/g, "").trim();
  return textMatch.substring(0, 100) + (textMatch.length > 100 ? "..." : "");
}

export function HiloCarouselCard({ hilo }: HiloCarouselCardProps) {
  const firstImage = extractFirstImage(hilo.contenido);
  const firstText = extractFirstParagraph(hilo.contenido);
  const hasWeaponStats = hilo.weapon_stats_record?.stats;

  return (
    <Link
      href={`/foro/hilos/${hilo.slug ?? hilo.id}`}
      className="group block h-full"
      prefetch={false}
    >
      <div className="flex flex-col h-full bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-800 amoled:border-gray-900 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
        {/* Imagen o Estadísticas del Arma */}
        <div className="relative w-full h-96 md:h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-black amoled:bg-black overflow-hidden flex items-center justify-center">
          {hasWeaponStats ? (
            <div className="w-full h-full flex items-center justify-center p-4 md:p-6 bg-gray-50 dark:bg-black amoled:bg-black">
              <div className="h-full w-full max-w-sm">
                <WeaponStatsCard
                  stats={hilo.weapon_stats_record!.stats}
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : firstImage ? (
            <img
              src={firstImage}
              alt={hilo.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-300 dark:text-gray-700 amoled:text-gray-800">
                  {hilo.titulo.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-col flex-1 p-3">
          {/* Título */}
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 amoled:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {hilo.titulo}
          </h3>

          {/* Preview de texto */}
          {!hasWeaponStats && (
            <p className="text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 line-clamp-2 mb-2">
              {firstText}
            </p>
          )}

          {/* Autor y fecha */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={hilo.autor?.avatar_url || ""} />
              <AvatarFallback className="text-xs">
                {hilo.autor?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 truncate">
                {hilo.autor?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 amoled:text-gray-600">
                {format(new Date(hilo.created_at), "d MMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 amoled:border-gray-900">
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{hilo.vistas}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{hilo.respuestas ?? 0}</span>
            </div>
            {hilo.votos !== undefined && hilo.votos !== 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{hilo.votos}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

"use client";

import Image from "next/image";
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
        {hasWeaponStats ? (
          <div className="relative w-full h-[22rem] md:h-[22rem] lg:h-[22rem] bg-gray-50 dark:bg-black amoled:bg-black overflow-hidden flex items-center justify-center p-0 md:p-1">
            <div className="h-full w-full max-w-sm">
              <WeaponStatsCard
                stats={hilo.weapon_stats_record!.stats}
                className="h-full w-full"
              />
            </div>
          </div>
        ) : firstImage ? (
          <div className="relative w-full h-[22rem] md:h-[22rem] lg:h-[22rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-black amoled:bg-black overflow-hidden flex items-center justify-center">
            <Image
              src={firstImage}
              alt={hilo.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="relative w-full h-[22rem] md:h-[22rem] lg:h-[22rem] bg-white dark:bg-black amoled:bg-black overflow-hidden p-4 md:p-6 flex flex-col">
            {/* Título */}
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 amoled:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {hilo.titulo}
            </h3>

            {/* Preview de texto */}
            <p className="text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 line-clamp-4 flex-1">
              {firstText}
            </p>
          </div>
        )}

        {/* Contenido */}
        <div className="flex flex-col flex-1 p-3">
          {/* Título (solo si hay imagen o estadísticas) */}
          {(hasWeaponStats || firstImage) && (
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 amoled:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {hilo.titulo}
            </h3>
          )}

          {/* Preview de texto (solo si hay imagen) */}
          {firstImage && !hasWeaponStats && (
            <p className="text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 line-clamp-2 mb-2">
              {firstText}
            </p>
          )}

          {/* Autor y Estadísticas en una línea */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 amoled:border-gray-900">
            {/* Autor a la izquierda */}
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5 flex-shrink-0">
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

            {/* Estadísticas a la derecha */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-500 flex-shrink-0">
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
      </div>
    </Link>
  );
}

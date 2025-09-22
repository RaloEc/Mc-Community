"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Eye,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Votacion } from "@/components/ui/Votacion";
import React from "react";
import { useUserTheme } from "@/hooks/useUserTheme";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export type HiloCardProps = {
  id: string;
  href: string;
  titulo: string;
  contenido?: string | null;
  categoriaNombre?: string;
  categoriaColor?: string;
  autorUsername?: string;
  autorAvatarUrl?: string | null;
  createdAt: string;
  vistas?: number;
  respuestas?: number;
  votosIniciales?: number;
  showSinRespuestasAlert?: boolean;
  className?: string;
};

function stripHtml(text?: string | null, maxLen: number = 80): string {
  if (!text) return "";
  const plain = text.replace(/<[^>]*>/g, "");
  return plain.length > maxLen ? plain.substring(0, maxLen) + "..." : plain;
}

export default function HiloCard(props: HiloCardProps) {
  const {
    id,
    href,
    titulo,
    contenido,
    categoriaNombre,
    categoriaColor,
    autorUsername = 'Anónimo',
    autorAvatarUrl,
    createdAt,
    vistas = 0,
    respuestas = 0,
    votosIniciales = 0,
    showSinRespuestasAlert = false,
    className = "",
  } = props;

  const badgeBg = (categoriaColor || "#3B82F6") + "20";
  const badgeFg = categoriaColor || "#3B82F6";
  const { userColor } = useUserTheme();

  return (
    <Link href={href} className={`${className} h-full block my-2`}>
      <Card className="group h-full flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm border-gray-200 dark:bg-black/80 dark:border-gray-800 hover:shadow-lg transition-all duration-300 rounded-xl">
        <CardContent className="p-0 h-full flex flex-col">
          <article className="flex flex-col h-full">
            {/* Contenido principal */}
            <div className="p-4 flex-1">
              {/* Fila de autor y categoría */}
              <div className="flex items-center justify-between mb-3">
                {/* Autor */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {autorAvatarUrl && (
                      <AvatarImage src={autorAvatarUrl} alt={autorUsername} className="object-cover" />
                    )}
                    <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                      {autorUsername.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {autorUsername}
                  </span>
                </div>

                {/* Categoría */}
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
                  {showSinRespuestasAlert && (
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  )}
                </div>
              </div>

              {/* Título y extracto */}
              <div className="space-y-2">
                <h3
                  className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 min-h-[3em] flex items-start"
                  title={titulo}
                >
                  {titulo}
                </h3>

                {contenido && (
                  <p
                    className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.8em] flex items-start"
                    title={stripHtml(contenido)}
                  >
                    {stripHtml(contenido)}
                  </p>
                )}
              </div>
            </div>

            {/* Barra inferior con estadísticas */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {/* Izquierda: Vistas y comentarios */}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {vistas || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {respuestas || 0}
                  </span>
                </div>

                {/* Centro: Votos */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Votacion 
                      id={id} 
                      tipo="hilo" 
                      votosIniciales={votosIniciales} 
                      size="sm"
                      className="h-6"
                    />
                  </div>
                </div>

                {/* Derecha: Fecha */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </CardContent>
      </Card>
    </Link>
  );
}

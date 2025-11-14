"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Clock,
  Newspaper,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import React from "react";

interface ActivityItem {
  id: string;
  type: "noticia" | "comentario" | "hilo" | "respuesta";
  title: string;
  preview?: string;
  timestamp: string;
  category: string;
}

interface UserActivityFeedProps {
  items: ActivityItem[];
  userColor?: string;
  isLoading?: boolean;
}

export const UserActivityFeed = ({
  items,
  userColor = "#3b82f6",
  isLoading = false,
}: UserActivityFeedProps) => {
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

  const getIcon = (type: string) => {
    switch (type) {
      case "noticia":
        return (
          <Newspaper
            className="w-5 h-5 flex-shrink-0"
            style={{ color: `var(--user-color)`, ...colorStyle }}
          />
        );
      case "comentario":
        return (
          <MessageCircle
            className="w-5 h-5 flex-shrink-0"
            style={{ color: `var(--user-color)`, ...colorStyle }}
          />
        );
      case "hilo":
        return (
          <Newspaper
            className="w-5 h-5 flex-shrink-0"
            style={{ color: `var(--user-color)`, ...colorStyle }}
          />
        );
      case "respuesta":
        return (
          <MessageCircle
            className="w-5 h-5 flex-shrink-0"
            style={{ color: `var(--user-color)`, ...colorStyle }}
          />
        );
      default:
        return null;
    }
  };

  const getLink = (item: ActivityItem) => {
    switch (item.type) {
      case "noticia":
        return `/noticias/${item.id.replace("noticia-", "")}`;
      case "comentario":
        return `/noticias`;
      case "hilo":
        return `/foro/hilos/${item.id.replace("hilo-", "")}`;
      case "respuesta":
        return `/foro`;
      default:
        return "#";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
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
      {items.map((item) => (
        <Card
          key={item.id}
          className="transition-shadow hover:shadow-lg dark:border-gray-800 overflow-hidden"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-grow min-w-0">
                  <Link href={getLink(item)} className="group">
                    <h3 className="text-base sm:text-lg font-semibold group-hover:underline line-clamp-2 text-foreground">
                      {item.title}
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
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatearFecha(item.timestamp)}
                    </span>
                  </div>
                </div>
                {getIcon(item.type)}
              </div>

              {/* Preview del contenido */}
              {item.preview && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.preview}
                </p>
              )}

              {/* Link */}
              <div className="pt-2 border-t dark:border-gray-700">
                <Link
                  href={getLink(item)}
                  className="flex items-center gap-1 text-xs hover:underline"
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
      ))}
    </div>
  );
};

export default UserActivityFeed;

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ServerIcon,
  UsersIcon,
  TagIcon,
  ExternalLinkIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Servidor } from "@/types";

interface ServerStatus {
  online: boolean;
  version?: string;
  players?: {
    online?: number;
    max?: number;
  };
  motd?: {
    clean?: string[];
  };
  error?: string;
}

interface ServidorCardProps {
  servidor: Servidor;
  onRefresh?: () => void;
}

export default function ServidorCard({
  servidor,
  onRefresh,
}: ServidorCardProps) {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para consultar el estado del servidor
  const checkServerStatus = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `https://api.mcsrvstat.us/2/${servidor.direccion_ip}`
      );
      const data = await response.json();

      setStatus(data);
    } catch (error) {
      console.error("Error al consultar estado del servidor:", error);
      setStatus({ online: false, error: "Error al consultar el servidor" });
    } finally {
      setLoading(false);
    }
  };

  // Consultar el estado al cargar el componente
  useEffect(() => {
    checkServerStatus();
  }, [servidor.direccion_ip]);

  // Función para refrescar el estado del servidor
  const refreshStatus = () => {
    checkServerStatus();
    if (onRefresh) onRefresh();
  };

  // Función para formatear jugadores
  const formatPlayers = () => {
    if (status && status.online && status.players) {
      return `${status.players.online}/${status.players.max}`;
    }
    return `${servidor.jugadores_actuales || 0}/${
      servidor.jugadores_maximos || 0
    }`;
  };

  // Función para copiar IP al portapapeles
  const copyIp = () => {
    navigator.clipboard.writeText(servidor.direccion_ip);
  };

  return (
    <Card
      className={`servidor-card overflow-hidden transition-all hover:shadow-md dark:bg-amoled-gray ${
        status?.online ? "online" : "offline"
      }`}
    >
      {/* Cabecera con borde superior coloreado según estado */}
      <div className="servidor-header relative bg-gradient-to-b from-primary/10 to-card/80 dark:from-primary/20 dark:to-amoled-gray/80 overflow-hidden border-t-4 border-t-solid border-t-status h-24">
        {servidor.banner_url ? (
          <Image
            src={servidor.banner_url}
            alt={servidor.nombre}
            fill
            className="object-cover opacity-40"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : null}

        {/* Badge destacado */}
      </div>

      {/* Información principal del servidor */}
      <div className="servidor-info p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="server-name text-lg font-bold servidor-header-title">
              {servidor.nombre}
            </h1>
            <p className="server-desc text-xs text-muted-foreground line-clamp-2 servidor-header-description">
              {servidor.descripcion}
            </p>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-1 h-6 servidor-header-badge"
          >
            <TagIcon className="h-3 w-3" />
            {servidor.tipo}
          </Badge>
        </div>

        {/* Estadísticas principales */}
        <div className="server-info grid grid-cols-2 gap-2 mb-3">
          <div className="info-item flex items-center gap-2">
            <div className="icon-container h-7 w-7 rounded-full flex items-center justify-center bg-primary/10 dark:bg-primary/20">
              <ServerIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="label text-xs text-muted-foreground">
                Versión
              </span>
              <span className="value block text-xs font-medium">
                {status?.online
                  ? status.version
                  : servidor.version || "Desconocida"}
              </span>
            </div>
          </div>

          <div className="info-item flex items-center gap-2">
            <div className="icon-container h-7 w-7 rounded-full flex items-center justify-center bg-primary/10 dark:bg-primary/20">
              <UsersIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="label text-xs text-muted-foreground">
                Jugadores
              </span>
              <span className="value block text-xs font-medium">
                {formatPlayers()}
              </span>
            </div>
          </div>
        </div>

        {/* IP del servidor */}
        <div className="server-ip mb-3">
          <div className="ip-container flex items-center justify-between p-2 rounded-md border border-border/50 bg-muted/30 dark:bg-amoled-gray/80 dark:border-border/30">
            <div>
              <span className="label text-xs text-muted-foreground">
                IP del servidor
              </span>
              <span className="ip block text-xs font-medium font-mono">
                {servidor.direccion_ip}
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="copy-btn h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                    onClick={copyIp}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-copy"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar IP</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* MOTD si está disponible (opcional, solo se muestra si hay espacio) */}
        {status?.online && status.motd && status.motd.clean && (
          <div className="motd p-2 rounded-md border border-border/50 bg-muted/30 dark:bg-amoled-gray/80 dark:border-border/30 mb-3">
            <p className="text-xs text-muted-foreground">Mensaje del día</p>
            <div>
              {status.motd.clean.slice(0, 1).map((line, index) => (
                <p key={index} className="text-xs italic truncate">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="actions flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refreshStatus}
            disabled={loading}
            className="refresh h-8 px-2"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>

          <Button
            size="sm"
            className="connect h-8 px-2 bg-primary hover:bg-primary/90"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
            Conectar
          </Button>
        </div>
      </div>
    </Card>
  );
}

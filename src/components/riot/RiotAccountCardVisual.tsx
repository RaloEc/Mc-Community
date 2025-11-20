"use client";

import { LinkedAccountRiot } from "@/types/riot";
import {
  getRankEmblemUrl,
  getTierColor,
  getTierDisplayName,
  calculateWinrate,
  getWinrateColor,
} from "@/lib/riot/rank-emblems";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Diccionario de regiones
const REGION_NAMES: Record<string, string> = {
  la1: "Latinoamérica",
  la2: "Latinoamérica Sur",
  na1: "Norteamérica",
  br1: "Brasil",
  euw1: "Europa Oeste",
  eun1: "Europa Nórdica",
  kr: "Corea",
  jp1: "Japón",
  ru: "Rusia",
  oc1: "Oceanía",
  ph2: "Filipinas",
  sg2: "Singapur",
  th2: "Tailandia",
  tw2: "Taiwán",
  vn2: "Vietnam",
  tr1: "Turquía",
  me1: "Oriente Medio",
};

interface RiotAccountCardVisualProps {
  account: LinkedAccountRiot;
  isLoading?: boolean;
  isSyncing?: boolean;
  syncError?: string | null;
  onSync?: () => void;
  onUnlink?: () => void;
  cooldownSeconds?: number;
}

/**
 * Tarjeta visual mejorada para mostrar información de Riot Games
 * Diseño tipo banner horizontal con emblema, información y estadísticas
 */
export function RiotAccountCardVisual({
  account,
  isLoading = false,
  isSyncing = false,
  syncError = null,
  onSync,
  onUnlink,
  cooldownSeconds = 0,
}: RiotAccountCardVisualProps) {
  const winrate = calculateWinrate(account.wins || 0, account.losses || 0);
  const winrateColor = getWinrateColor(winrate);
  const tierColor = getTierColor(account.tier);
  const tierDisplayName = getTierDisplayName(account.tier);
  const emblemUrl = getRankEmblemUrl(account.tier);

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const regionName = REGION_NAMES[account.region] || account.region;

  return (
    <div className="w-full space-y-4">
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-lg bg-black dark:bg-black amoled:bg-black border border-slate-800 dark:border-slate-800 amoled:border-slate-800 shadow-lg">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${tierColor} 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* Contenido */}
        <div className="relative p-6 flex items-center gap-6">
          {/* Sección Izquierda: Ícono del Invocador */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full border-4 border-blue-500 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
              {account.profile_icon_id ? (
                <Image
                  src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${account.profile_icon_id}.jpg`}
                  alt="Ícono del invocador"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {account.game_name
                    ? account.game_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            {account.summoner_level && (
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Nivel
                </p>
                <p className="text-lg font-bold text-white">
                  {account.summoner_level}
                </p>
              </div>
            )}
          </div>

          {/* Sección Centro: Información del Jugador */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-white truncate">
                {account.game_name || "Desconocido"}
                <span className="text-slate-400 ml-1">
                  #{account.tag_line || "N/A"}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Badge
                variant="outline"
                className="text-xs bg-slate-900 border-slate-700 text-slate-300"
              >
                {regionName}
              </Badge>
            </div>

            {/* Barra de Winrate */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Winrate: {winrate}%
                </span>
                <span className="text-xs text-slate-400">
                  {account.wins}W - {account.losses}L
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${winrateColor} transition-all duration-300`}
                  style={{ width: `${winrate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sección Derecha: Rango */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            {/* Emblema del Rango - Mucho más grande */}
            <div className="relative w-40 h-56">
              <Image
                src={emblemUrl}
                alt={`${tierDisplayName} Emblema`}
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            {/* Información del Rango */}
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <span className="text-lg font-bold text-white">
                  {tierDisplayName}
                </span>
                {account.rank && (
                  <span
                    className="text-lg font-bold"
                    style={{ color: tierColor }}
                  >
                    {account.rank}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-amber-400">
                {account.league_points} LP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error de Sincronización */}
      {syncError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {syncError}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-3">
        <Button
          onClick={onSync}
          disabled={isSyncing || cooldownSeconds > 0}
          variant="outline"
          className="flex-1"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : cooldownSeconds > 0 ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 opacity-50" />
              Espera {cooldownSeconds}s
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </>
          )}
        </Button>

        <Button
          onClick={onUnlink}
          variant="outline"
          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Unlink className="mr-2 h-4 w-4" />
          Desvincular
        </Button>
      </div>

      {/* Información de Última Actualización */}
      <div className="text-xs text-slate-400 text-center">
        Última actualización:{" "}
        {account.last_updated
          ? new Date(account.last_updated).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Nunca"}
      </div>
    </div>
  );
}

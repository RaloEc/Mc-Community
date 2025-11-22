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
      <div className="w-full bg-white dark:bg-[#0f111a] amoled:bg-black rounded-xl p-8 flex items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
      </div>
    );
  }

  const regionName = REGION_NAMES[account.region] || account.region;

  return (
    <div className="w-full">
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#0f111a] amoled:bg-black border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Left: Profile Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1a1d26] shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {account.game_name
                    ? account.game_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            {account.summoner_level && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-0.5 rounded-full border-2 border-white dark:border-[#1a1d26] shadow-sm whitespace-nowrap">
                Lvl {account.summoner_level}
              </div>
            )}
          </div>

          {/* Middle: Info */}
          <div className="flex-1 text-center md:text-left space-y-3 min-w-0 w-full">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {account.game_name}
                <span className="text-gray-400 font-normal ml-1">
                  #{account.tag_line}
                </span>
              </h3>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {regionName}
                </span>
                {/* Mobile Rank Badge */}
                <span
                  className="md:hidden text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800"
                  style={{ color: tierColor }}
                >
                  {tierDisplayName} {account.rank}
                </span>
              </div>
            </div>

            {/* Minimalist Winrate Bar */}
            <div className="max-w-md mx-auto md:mx-0">
              <div className="flex justify-between text-xs mb-1.5 text-gray-500 dark:text-gray-400 font-medium">
                <span
                  className={winrate >= 50 ? "text-green-500" : "text-gray-500"}
                >
                  Winrate {winrate}%
                </span>
                <span>
                  {account.wins}W - {account.losses}L
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${winrateColor} rounded-full`}
                  style={{ width: `${winrate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Rank (Desktop) */}
          <div className="hidden md:flex items-center gap-4 pr-4">
            <div className="text-right z-10">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                {tierDisplayName}
              </p>
              <p
                className="text-4xl font-bold leading-none tracking-tight"
                style={{ color: tierColor }}
              >
                {account.rank}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                {account.league_points} LP
              </p>
            </div>
            <div className="relative w-40 h-40 drop-shadow-2xl filter -my-6">
              <Image
                src={emblemUrl}
                alt={`${tierDisplayName} Emblema`}
                fill
                className="object-contain scale-110"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="text-xs text-gray-400">
          {syncError ? (
            <span className="text-red-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3" /> {syncError}
            </span>
          ) : (
            <span>
              Actualizado:{" "}
              {account.last_updated
                ? new Date(account.last_updated).toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Nunca"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onSync}
            disabled={isSyncing || cooldownSeconds > 0}
            className="text-xs font-medium text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {isSyncing
              ? "Sincronizando..."
              : cooldownSeconds > 0
              ? `Espera ${cooldownSeconds}s`
              : "Actualizar Datos"}
          </button>

          <button
            onClick={onUnlink}
            className="text-xs font-medium text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <Unlink className="w-3 h-3" />
            Desvincular
          </button>
        </div>
      </div>
    </div>
  );
}

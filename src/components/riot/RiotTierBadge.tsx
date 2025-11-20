"use client";

import Image from "next/image";
import { getRankEmblemUrl } from "@/lib/riot/rank-emblems";

interface RiotTierBadgeProps {
  tier?: string | null;
  rank?: string | null;
  size?: "sm" | "md" | "lg";
}

export function RiotTierBadge({ tier, rank, size = "md" }: RiotTierBadgeProps) {
  // Solo mostrar si es Gold o superior
  const validTiers = [
    "GOLD",
    "PLATINUM",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ];

  if (!tier || !validTiers.includes(tier.toUpperCase())) {
    return null;
  }

  const sizeMap = {
    sm: { width: 24, height: 24, className: "w-6 h-6" },
    md: { width: 32, height: 32, className: "w-8 h-8" },
    lg: { width: 48, height: 48, className: "w-12 h-12" },
  };

  const config = sizeMap[size];
  const emblemUrl = getRankEmblemUrl(tier);

  return (
    <div className="relative group">
      <Image
        src={emblemUrl}
        alt={`${tier} ${rank || ""}`}
        width={config.width}
        height={config.height}
        className={`${config.className} object-contain drop-shadow-lg`}
        title={`${tier} ${rank || ""}`}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {tier} {rank}
      </div>
    </div>
  );
}

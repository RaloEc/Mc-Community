"use client";

import { Newspaper, Trophy } from "lucide-react";

export type ProfileTab = "posts" | "lol";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  hasRiotAccount: boolean;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  hasRiotAccount,
}: ProfileTabsProps) {
  return (
    <div className="flex gap-6 border-b border-slate-700 px-4 py-3 bg-slate-900/50 backdrop-blur-sm">
      {/* Pestaña Actividad */}
      <button
        onClick={() => onTabChange("posts")}
        className={`flex items-center gap-2 pb-3 px-2 font-medium transition-all ${
          activeTab === "posts"
            ? "text-white border-b-2 border-blue-500"
            : "text-slate-400 hover:text-slate-300 border-b-2 border-transparent"
        }`}
      >
        <Newspaper size={18} />
        <span>Actividad</span>
      </button>

      {/* Pestaña League of Legends (solo si tiene cuenta vinculada) */}
      {hasRiotAccount && (
        <button
          onClick={() => onTabChange("lol")}
          className={`flex items-center gap-2 pb-3 px-2 font-medium transition-all ${
            activeTab === "lol"
              ? "text-white border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-300 border-b-2 border-transparent"
          }`}
        >
          <Trophy size={18} />
          <span>League of Legends</span>
        </button>
      )}
    </div>
  );
}

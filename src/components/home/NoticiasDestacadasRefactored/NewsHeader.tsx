"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Flame, Star } from "lucide-react";
import { TabType } from "./types";

interface NewsHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userColor: string;
}

export function NewsHeader({
  activeTab,
  onTabChange,
  userColor,
}: NewsHeaderProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white py-4">
            Noticias
          </h2>

          {/* Pestañas de navegación (solo escritorio) */}
          <div className="hidden md:flex -mb-px space-x-8">
            <button
              onClick={() => onTabChange("destacadas")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "destacadas"
                  ? "border-current text-current"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              style={
                activeTab === "destacadas"
                  ? { color: userColor, borderColor: userColor }
                  : {}
              }
            >
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Destacadas
              </div>
            </button>
            <button
              onClick={() => onTabChange("recientes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "recientes"
                  ? "border-current text-current"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              style={
                activeTab === "recientes"
                  ? { color: userColor, borderColor: userColor }
                  : {}
              }
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recientes
              </div>
            </button>
            <button
              onClick={() => onTabChange("populares")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "populares"
                  ? "border-current text-current"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              style={
                activeTab === "populares"
                  ? { color: userColor, borderColor: userColor }
                  : {}
              }
            >
              <div className="flex items-center">
                <Flame className="h-4 w-4 mr-2" />
                Populares
              </div>
            </button>
          </div>

          <div className="hidden md:block">
            <Link href="/noticias">
              <Button variant="outline" size="sm" className="group">
                Ver todas{" "}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

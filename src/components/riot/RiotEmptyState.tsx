"use client";

import { useState } from "react";
import { Trophy, Link as LinkIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManualRiotLinkModal } from "./ManualRiotLinkModal";

interface RiotEmptyStateProps {
  isOwnProfile: boolean;
  onLinkClick?: () => void;
  onManualLinkSuccess?: () => void | Promise<void>;
}

export function RiotEmptyState({
  isOwnProfile,
  onLinkClick,
  onManualLinkSuccess,
}: RiotEmptyStateProps) {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  if (!isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Trophy size={48} className="text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          Sin cuenta vinculada
        </h3>
        <p className="text-slate-400 text-center max-w-md">
          Este usuario no ha vinculado su cuenta de Riot Games aún.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/50 rounded-lg border border-slate-700 m-4">
        <Trophy size={48} className="text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Vincula tu cuenta de Riot
        </h3>
        <p className="text-slate-400 text-center max-w-md mb-6">
          Conecta tu cuenta de League of Legends para ver tus estadísticas,
          historial de partidas y medallas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Botón OAuth (si está disponible) */}
          {onLinkClick && (
            <Button
              onClick={onLinkClick}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <LinkIcon size={18} />
              Vincular con Riot
            </Button>
          )}

          {/* Botón de vinculación manual */}
          <Button
            onClick={() => setIsManualModalOpen(true)}
            variant="outline"
            className="border-slate-600 hover:bg-slate-800 flex items-center gap-2"
          >
            <Search size={18} />
            Buscar y Vincular
          </Button>
        </div>
      </div>

      {/* Modal de vinculación manual */}
      <ManualRiotLinkModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={onManualLinkSuccess}
      />
    </>
  );
}

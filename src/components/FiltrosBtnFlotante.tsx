'use client';

import { FilterIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FiltrosBtnFlotanteProps {
  modalAbierto: boolean;
  onAbrirModal: () => void;
  hayFiltrosActivos?: boolean;
  cantidadFiltros?: number;
}

export default function FiltrosBtnFlotante({ 
  modalAbierto, 
  onAbrirModal,
  hayFiltrosActivos = false,
  cantidadFiltros = 0
}: FiltrosBtnFlotanteProps) {
  return (
    <button
      onClick={onAbrirModal}
      className="md:hidden fixed left-4 bottom-4 z-[100] flex items-center justify-center p-4 rounded-full shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95"
      aria-label={hayFiltrosActivos ? `Abrir filtros (${cantidadFiltros} activos)` : "Abrir filtros"}
      aria-expanded={modalAbierto}
    >
      <div className="flex items-center relative">
        <FilterIcon size={24} className="text-primary-foreground" />
        
        {/* Badge con cantidad de filtros activos */}
        {hayFiltrosActivos && cantidadFiltros > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-destructive text-destructive-foreground border-2 border-background"
            style={{
              animation: 'suaveRespirar 2s infinite ease-in-out',
            }}
          >
            {cantidadFiltros}
          </Badge>
        )}
      </div>
    </button>
  );
}

'use client';

import { FilterIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FiltrosBtnFlotanteProps {
  modalAbierto: boolean;
  onAbrirModal: () => void;
  hayFiltrosActivos?: boolean;
}

export default function FiltrosBtnFlotante({ 
  modalAbierto, 
  onAbrirModal,
  hayFiltrosActivos = false 
}: FiltrosBtnFlotanteProps) {
  return (
    <button
      onClick={onAbrirModal}
      className="md:hidden fixed bottom-6 right-6 z-10 flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700"
      aria-label="Abrir filtros"
    >
      <div className="flex items-center relative">
        <FilterIcon size={24} className="text-white" />
        
        {/* Indicador con efecto de brillo (glow) */}
        {hayFiltrosActivos && (
          <div 
            className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3.5 w-3.5 border border-white"
            style={{
              animation: 'suaveRespirar 2s infinite ease-in-out',
              boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)',
              transform: 'scale(1)',
            }}
          >
            <span className="sr-only">Filtros activos</span>
          </div>
        )}
      </div>
    </button>
  );
}

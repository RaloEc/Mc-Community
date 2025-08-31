'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ForoFiltersState {
  tab: 'recientes' | 'populares' | 'sin_respuesta' | 'siguiendo' | 'mios';
  timeRange: '24h' | '7d';
}

interface ForoFiltrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: ForoFiltersState;
  onChange: (filters: ForoFiltersState) => void;
  onAplicarFiltros: () => void;
}

// Componente TabButton para los botones de filtro
interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

const TabButton = ({ children, active, onClick, className = '' }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800',
        className
      )}
    >
      {children}
    </button>
  );
};

export default function ForoFiltrosModal({
  isOpen,
  onClose,
  value,
  onChange,
  onAplicarFiltros
}: ForoFiltrosModalProps) {
  // Estado temporal para los filtros mientras el modal está abierto
  const [tempFilters, setTempFilters] = useState<ForoFiltersState>(value);

  // Actualizar estado temporal cuando cambian los filtros externos
  useEffect(() => {
    if (isOpen) {
      setTempFilters(value);
    }
  }, [isOpen, value]);

  const handleApply = () => {
    onChange(tempFilters);
    onAplicarFiltros();
    onClose();
  };

  const handleTabChange = (tab: ForoFiltersState['tab']) => {
    setTempFilters(prev => ({ ...prev, tab }));
  };

  const handleTimeRangeChange = (timeRange: ForoFiltersState['timeRange']) => {
    setTempFilters(prev => ({ ...prev, timeRange }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Overlay de fondo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 w-full sm:w-[95%] max-w-md rounded-t-xl sm:rounded-xl bg-white dark:bg-black rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtrar hilos</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Sección de pestañas */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Filtrar hilos</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TabButton
                    active={tempFilters.tab === 'recientes'}
                    onClick={() => handleTabChange('recientes')}
                  >
                    Recientes
                  </TabButton>
                  <TabButton
                    active={tempFilters.tab === 'populares'}
                    onClick={() => handleTabChange('populares')}
                  >
                    Populares
                  </TabButton>
                  <TabButton
                    active={tempFilters.tab === 'sin_respuesta'}
                    onClick={() => handleTabChange('sin_respuesta')}
                  >
                    Sin respuesta
                  </TabButton>
                  <TabButton
                    active={tempFilters.tab === 'siguiendo'}
                    onClick={() => handleTabChange('siguiendo')}
                  >
                    Siguiendo
                  </TabButton>
                  <TabButton
                    active={tempFilters.tab === 'mios'}
                    onClick={() => handleTabChange('mios')}
                  >
                    Mis hilos
                  </TabButton>
                </div>
              </div>

              {/* Opciones de tiempo para populares */}
              {tempFilters.tab === 'populares' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Periodo de tiempo:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <TabButton
                      active={tempFilters.timeRange === '24h'}
                      onClick={() => handleTimeRangeChange('24h')}
                    >
                      Últimas 24h
                    </TabButton>
                    <TabButton
                      active={tempFilters.timeRange === '7d'}
                      onClick={() => handleTimeRangeChange('7d')}
                    >
                      Última semana
                    </TabButton>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

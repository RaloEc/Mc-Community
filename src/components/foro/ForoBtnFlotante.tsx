'use client';

import { useState } from 'react';
import { FilterIcon, PlusIcon, X, AlertCircle, Clock, TrendingUp, MessageSquare, Star, User } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ForoBtnFlotanteProps {
  hayFiltrosActivos?: boolean;
  onAbrirFiltros: () => void;
  usuarioAutenticado: boolean;
  onCambiarFiltro?: (tab: 'recientes' | 'populares' | 'sin_respuesta' | 'siguiendo' | 'mios') => void;
  filtroActivo?: 'recientes' | 'populares' | 'sin_respuesta' | 'siguiendo' | 'mios';
}

export default function ForoBtnFlotante({ 
  hayFiltrosActivos = false,
  onAbrirFiltros,
  usuarioAutenticado,
  onCambiarFiltro,
  filtroActivo = 'recientes'
}: ForoBtnFlotanteProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-10">
      {/* Menú de opciones */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-white dark:bg-black rounded-lg shadow-lg p-2 mb-2 min-w-[160px] border border-gray-200 dark:border-gray-800"
          >
            <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-2">
              <div className="px-4 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">Filtros</div>
              
              <button
                onClick={() => {
                  if (onCambiarFiltro) onCambiarFiltro('recientes');
                  setMenuAbierto(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-left ${filtroActivo === 'recientes' ? 'bg-gray-100 dark:bg-black text-primary' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md`}
              >
                <Clock size={16} className="mr-2" />
                <span>Recientes</span>
              </button>
              
              <button
                onClick={() => {
                  if (onCambiarFiltro) onCambiarFiltro('populares');
                  setMenuAbierto(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-left ${filtroActivo === 'populares' ? 'bg-gray-100 dark:bg-black text-primary' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md`}
              >
                <TrendingUp size={16} className="mr-2" />
                <span>Populares</span>
              </button>
              
              <button
                onClick={() => {
                  if (onCambiarFiltro) onCambiarFiltro('sin_respuesta');
                  setMenuAbierto(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-left ${filtroActivo === 'sin_respuesta' ? 'bg-gray-100 dark:bg-black text-primary' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md`}
              >
                <MessageSquare size={16} className="mr-2" />
                <span>Sin respuesta</span>
              </button>
              
              <button
                onClick={() => {
                  if (onCambiarFiltro) onCambiarFiltro('siguiendo');
                  setMenuAbierto(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-left ${filtroActivo === 'siguiendo' ? 'bg-gray-100 dark:bg-black text-primary' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md`}
              >
                <Star size={16} className="mr-2" />
                <span>Siguiendo</span>
              </button>
              
              <button
                onClick={() => {
                  if (onCambiarFiltro) onCambiarFiltro('mios');
                  setMenuAbierto(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-left ${filtroActivo === 'mios' ? 'bg-gray-100 dark:bg-black text-primary' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md`}
              >
                <User size={16} className="mr-2" />
                <span>Mis hilos</span>
              </button>
              
            </div>
            
            {usuarioAutenticado ? (
              <Link 
                href="/foro/crear-hilo"
                className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <PlusIcon size={18} className="mr-2" />
                <span>Crear hilo</span>
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center w-full px-4 py-2 text-left text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-black rounded-md cursor-not-allowed"
                    >
                      <PlusIcon size={18} className="mr-2" />
                      <span>Crear hilo</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs bg-gray-800 dark:bg-black text-white border-gray-700">
                    Inicia sesión para crear
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 border border-primary/20 dark:border-primary/10"
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
      >
        <div className="flex items-center relative">
          {menuAbierto ? (
            <X size={24} className="text-primary-foreground" />
          ) : (
            <>
              <PlusIcon size={24} className="text-primary-foreground" />
              
              {/* Indicador de filtros activos */}
              {hayFiltrosActivos && (
                <div 
                  className="absolute -top-1 -right-1 bg-destructive rounded-full h-3.5 w-3.5 border border-background"
                  style={{
                    animation: 'suaveRespirar 2s infinite ease-in-out',
                    boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)',
                    transform: 'scale(1)',
                  }}
                >
                  <span className="sr-only">Filtros activos</span>
                </div>
              )}
            </>
          )}
        </div>
      </button>
    </div>
  );
}

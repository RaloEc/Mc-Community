'use client';

import { useEffect, useState } from 'react';
import { XIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Noticia } from '@/types';

interface FiltrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  busqueda: string;
  autor: string;
  categoria: string;
  ordenFecha: 'asc' | 'desc';
  categorias: {id: string, nombre: string}[];
  filtrosActivos: {tipo: string, valor: string, etiqueta: string}[];
  onBusquedaChange: (valor: string) => void;
  onAutorChange: (valor: string) => void;
  onCategoriaChange: (valor: string) => void;
  onOrdenFechaChange: (valor: 'asc' | 'desc') => void;
  onAplicarFiltros: () => void;
  onLimpiarFiltros: () => void;
  onEliminarFiltro: (tipo: string) => void;
}

export default function FiltrosModal({
  isOpen,
  onClose,
  busqueda,
  autor,
  categoria,
  ordenFecha,
  categorias,
  filtrosActivos,
  onBusquedaChange,
  onAutorChange,
  onCategoriaChange,
  onOrdenFechaChange,
  onAplicarFiltros,
  onLimpiarFiltros,
  onEliminarFiltro
}: FiltrosModalProps) {
  const [animateIn, setAnimateIn] = useState(false);
  
  // Manejar animación de entrada y salida
  useEffect(() => {
    if (isOpen) {
      // Pequeño retraso para permitir que el DOM se actualice antes de iniciar la animación
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay con animación */}
      <div 
        className={`fixed inset-0 bg-background/80 transition-opacity duration-300 ${
          animateIn ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal con animación */}
      <div 
        className={`relative bg-card rounded-lg w-[90%] max-w-md max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center">
            <FilterIcon size={18} className="mr-2" />
            Filtros de búsqueda
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="titleSearch" className="text-sm font-medium">Título</label>
                <input 
                  type="text" 
                  id="titleSearch" 
                  placeholder="Buscar por título..." 
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={busqueda}
                  onChange={(e) => onBusquedaChange(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="authorSearch" className="text-sm font-medium">Autor</label>
                <input 
                  type="text" 
                  id="authorSearch" 
                  placeholder="Buscar por autor..." 
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={autor}
                  onChange={(e) => onAutorChange(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="categoryFilter" className="text-sm font-medium">Categoría</label>
                <select 
                  id="categoryFilter"
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={categoria}
                  onChange={(e) => onCategoriaChange(e.target.value)}
                >
                  <option value="">Todas las Categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dateSort" className="text-sm font-medium">Ordenar por fecha</label>
                <select 
                  id="dateSort"
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={ordenFecha}
                  onChange={(e) => onOrdenFechaChange(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Más recientes primero</option>
                  <option value="asc">Más antiguas primero</option>
                </select>
              </div>
            </div>
            
            {filtrosActivos.length > 0 && (
              <div className="w-full bg-muted p-2 rounded-md border border-border transition-all duration-300 mt-2">
                <div className="text-xs text-gray-400 mb-1.5">Filtros activos:</div>
                <div className="flex flex-wrap gap-2 transition-all duration-300">
                  {filtrosActivos.map((filtro, index) => (
                    <div 
                      key={index} 
                      className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] transition-all duration-300 animate-fadeIn shadow-sm"
                    >
                      {filtro.etiqueta}
                      <button 
                        onClick={() => onEliminarFiltro(filtro.tipo)}
                        className="ml-2 hover:text-opacity-80 transition-all duration-300"
                        aria-label="Eliminar filtro"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Pie del modal con botones */}
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <button 
            className="p-[0.6rem] px-4 h-[38px] bg-muted text-muted-foreground rounded-[5px] whitespace-nowrap hover:opacity-90 transition-all duration-300"
            onClick={onLimpiarFiltros}
          >
            Limpiar
          </button>
          <button 
            className="p-[0.6rem] px-4 h-[38px] bg-primary text-primary-foreground rounded-[5px] whitespace-nowrap hover:opacity-90 transition-all duration-300"
            onClick={() => {
              onAplicarFiltros();
              onClose();
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

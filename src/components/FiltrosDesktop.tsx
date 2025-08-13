'use client';

import { FilterIcon, XIcon } from 'lucide-react';

interface FiltrosDesktopProps {
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

export default function FiltrosDesktop({
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
}: FiltrosDesktopProps) {
  return (
    <div className="hidden md:block bg-card rounded-lg border border-border mb-6 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Título con icono */}
        <div className="flex items-center mr-2">
          <FilterIcon size={16} className="mr-1" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        {/* Inputs y selects en línea */}
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <input 
            type="text" 
            placeholder="Título..." 
            className="p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[200px]"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
          
          {/* Campo de autor oculto pero manteniendo la funcionalidad */}
          <input 
            type="text" 
            placeholder="Autor..." 
            className="hidden p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[200px]"
            value={autor}
            onChange={(e) => onAutorChange(e.target.value)}
          />
          
          <select 
            className="p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[200px]"
            value={categoria}
            onChange={(e) => onCategoriaChange(e.target.value)}
          >
            <option value="">Categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          
          <select 
            className="p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[180px]"
            value={ordenFecha}
            onChange={(e) => onOrdenFechaChange(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Más recientes</option>
            <option value="asc">Más antiguas</option>
          </select>
        </div>
        
        {/* Botones */}
        <div className="flex gap-2 ml-auto">
          <button 
            className="p-1 px-3 h-[32px] bg-muted text-muted-foreground text-sm rounded-[5px] whitespace-nowrap hover:opacity-90"
            onClick={onLimpiarFiltros}
          >
            Limpiar
          </button>
          <button 
            className="p-1 px-3 h-[32px] bg-primary text-primary-foreground text-sm rounded-[5px] whitespace-nowrap hover:opacity-90"
            onClick={onAplicarFiltros}
          >
            Aplicar
          </button>
        </div>
      </div>
      
      {/* Filtros activos */}
      {filtrosActivos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className="text-xs text-gray-400">Activos:</span>
          {filtrosActivos.map((filtro, index) => (
            <div 
              key={index} 
              className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm"
            >
              {filtro.etiqueta}
              <button 
                onClick={() => onEliminarFiltro(filtro.tipo)}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

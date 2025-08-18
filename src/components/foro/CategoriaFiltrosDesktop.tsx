'use client';

import { FilterIcon, XIcon } from 'lucide-react';
import { CategoriaFiltersState } from './CategoriaFilters';

type Tag = { id: string; nombre: string; slug: string };

interface CategoriaFiltrosDesktopProps {
  tags: Tag[];
  value: CategoriaFiltersState;
  onChange: (next: CategoriaFiltersState) => void;
  onAplicarFiltros: () => void;
  onLimpiarFiltros: () => void;
}

export default function CategoriaFiltrosDesktop({
  tags,
  value,
  onChange,
  onAplicarFiltros,
  onLimpiarFiltros
}: CategoriaFiltrosDesktopProps) {
  const orderOptions = [
    { key: 'ultimo', label: 'Último mensaje' },
    { key: 'creacion', label: 'Fecha de creación' },
    { key: 'respuestas', label: 'Número de respuestas' },
    { key: 'vistas', label: 'Número de vistas' },
    { key: 'destacados', label: 'Hilos destacados' },
  ] as const;

  const toggleTag = (slug: string) => {
    const set = new Set(value.tags);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    onChange({ ...value, tags: Array.from(set) });
  };

  // Determinar si hay filtros activos
  const hayFiltrosActivos = value.tags.length > 0 || 
    value.estado !== undefined || 
    value.popularidad !== undefined || 
    value.fechaFrom !== undefined || 
    value.fechaTo !== undefined || 
    value.destacados === true;

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
          <select 
            className="p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[180px]"
            value={value.orderBy}
            onChange={(e) => onChange({ ...value, orderBy: e.target.value as CategoriaFiltersState['orderBy'] })}
          >
            {orderOptions.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          
          <select 
            className="p-1 px-2 border border-input rounded-[5px] bg-background text-foreground h-[32px] text-sm flex-1 min-w-[120px] max-w-[160px]"
            value={value.popularidad || ''}
            onChange={(e) => onChange({ ...value, popularidad: e.target.value || undefined })}
          >
            <option value="">Popularidad</option>
            <option value="vistas">Más vistas</option>
            <option value="votos">Más votados</option>
          </select>

          <div className="flex items-center gap-1 min-w-[120px]">
            <input
              id="destacadosCheck"
              type="checkbox"
              checked={!!value.destacados}
              onChange={(e) => onChange({ ...value, destacados: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="destacadosCheck" className="text-xs">Destacados</label>
          </div>
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
      
      {/* Etiquetas */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className="text-xs text-gray-400">Etiquetas:</span>
          <div className="flex flex-wrap gap-1">
            {tags.map(t => {
              const active = value.tags.includes(t.slug);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.slug)}
                  className={`px-2 py-1 rounded-full text-xs border transition-colors ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-foreground border-border'}`}
                >
                  {t.nombre}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Filtros activos */}
      {hayFiltrosActivos && (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className="text-xs text-gray-400">Activos:</span>
          
          {value.estado && (
            <div className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm">
              Estado: {value.estado}
              <button 
                onClick={() => onChange({ ...value, estado: undefined })}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}
          
          {value.popularidad && (
            <div className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm">
              {value.popularidad === 'vistas' ? 'Más vistas' : 'Más votados'}
              <button 
                onClick={() => onChange({ ...value, popularidad: undefined })}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}
          
          {value.fechaFrom && (
            <div className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm">
              Desde: {value.fechaFrom}
              <button 
                onClick={() => onChange({ ...value, fechaFrom: undefined })}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}
          
          {value.fechaTo && (
            <div className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm">
              Hasta: {value.fechaTo}
              <button 
                onClick={() => onChange({ ...value, fechaTo: undefined })}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}
          
          {value.destacados && (
            <div className="inline-flex items-center bg-primary text-primary-foreground text-xs py-1 px-2 rounded-[15px] animate-fadeIn shadow-sm">
              Destacados
              <button 
                onClick={() => onChange({ ...value, destacados: false })}
                className="ml-1 hover:text-opacity-80"
                aria-label="Eliminar filtro"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

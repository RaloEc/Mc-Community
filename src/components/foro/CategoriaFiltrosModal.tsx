'use client';

import { useEffect, useState } from 'react';
import { XIcon, FilterIcon } from 'lucide-react';
import { CategoriaFiltersState } from './CategoriaFilters';

type Tag = { id: string; nombre: string; slug: string };

interface CategoriaFiltrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  value: CategoriaFiltersState;
  onChange: (next: CategoriaFiltersState) => void;
  onAplicarFiltros: () => void;
  onLimpiarFiltros: () => void;
}

export default function CategoriaFiltrosModal({
  isOpen,
  onClose,
  tags,
  value,
  onChange,
  onAplicarFiltros,
  onLimpiarFiltros
}: CategoriaFiltrosModalProps) {
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
            Filtros del foro
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
                <label htmlFor="orderSelect" className="text-sm font-medium">Ordenar por</label>
                <select 
                  id="orderSelect"
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={value.orderBy}
                  onChange={(e) => onChange({ ...value, orderBy: e.target.value as CategoriaFiltersState['orderBy'] })}
                >
                  {orderOptions.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="estadoSelect" className="text-sm font-medium">Estado</label>
                <select 
                  id="estadoSelect"
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={value.estado || ''}
                  onChange={(e) => onChange({ ...value, estado: e.target.value || undefined })}
                >
                  <option value="">(Próximamente)</option>
                  <option value="abierto" disabled>Abierto</option>
                  <option value="cerrado" disabled>Cerrado</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="popularidadSelect" className="text-sm font-medium">Popularidad</label>
                <select 
                  id="popularidadSelect"
                  className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full transition-all duration-300"
                  value={value.popularidad || ''}
                  onChange={(e) => onChange({ ...value, popularidad: e.target.value || undefined })}
                >
                  <option value="">General</option>
                  <option value="vistas">Más vistas</option>
                  <option value="votos">Más votados</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fechas</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="fechaFrom" className="text-xs text-muted-foreground">Desde</label>
                    <input
                      id="fechaFrom"
                      type="date"
                      value={value.fechaFrom || ''}
                      onChange={(e) => onChange({ ...value, fechaFrom: e.target.value || undefined })}
                      className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="fechaTo" className="text-xs text-muted-foreground">Hasta</label>
                    <input
                      id="fechaTo"
                      type="date"
                      value={value.fechaTo || ''}
                      onChange={(e) => onChange({ ...value, fechaTo: e.target.value || undefined })}
                      className="p-[0.6rem] border border-input rounded-[5px] bg-background text-foreground h-[38px] w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <label htmlFor="destacadosCheck" className="text-sm font-medium">Mostrar solo destacados</label>
                <input
                  id="destacadosCheck"
                  type="checkbox"
                  checked={!!value.destacados}
                  onChange={(e) => onChange({ ...value, destacados: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
            </div>
            
            {/* Etiquetas */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">No hay etiquetas en esta categoría.</span>
                )}
                {tags.map(t => {
                  const active = value.tags.includes(t.slug);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTag(t.slug)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-foreground border-border'}`}
                    >
                      {t.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
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

'use client';

import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onPaginaCambio: (pagina: number) => void;
  mostrarPrimeraUltima?: boolean;
}

const Paginacion: React.FC<PaginacionProps> = ({
  paginaActual,
  totalPaginas,
  onPaginaCambio,
  mostrarPrimeraUltima = true
}) => {
  // Generar array de números de página a mostrar
  const generarPaginas = (): (number | string)[] => {
    const paginas: (number | string)[] = [];
    const maxPaginasVisibles = 7;
    
    if (totalPaginas <= maxPaginasVisibles) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      paginas.push(1);
      
      // Calcular rango alrededor de la página actual
      let inicio = Math.max(2, paginaActual - 1);
      let fin = Math.min(totalPaginas - 1, paginaActual + 1);
      
      // Ajustar si estamos cerca del inicio
      if (paginaActual <= 3) {
        fin = 5;
      }
      
      // Ajustar si estamos cerca del final
      if (paginaActual >= totalPaginas - 2) {
        inicio = totalPaginas - 4;
      }
      
      // Añadir puntos suspensivos si es necesario
      if (inicio > 2) {
        paginas.push('...');
      }
      
      // Añadir páginas del rango
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
      
      // Añadir puntos suspensivos si es necesario
      if (fin < totalPaginas - 1) {
        paginas.push('...');
      }
      
      // Siempre mostrar la última página
      paginas.push(totalPaginas);
    }
    
    return paginas;
  };

  const paginas = generarPaginas();

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo activar si no hay un input/textarea enfocado
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && paginaActual > 1) {
        e.preventDefault();
        onPaginaCambio(paginaActual - 1);
      } else if (e.key === 'ArrowRight' && paginaActual < totalPaginas) {
        e.preventDefault();
        onPaginaCambio(paginaActual + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginaActual, totalPaginas, onPaginaCambio]);

  if (totalPaginas <= 1) {
    return null;
  }

  return (
    <nav 
      className="flex items-center justify-center gap-1 mt-8"
      role="navigation"
      aria-label="Paginación de noticias"
    >
      {/* Botón primera página */}
      {mostrarPrimeraUltima && (
        <button
          onClick={() => onPaginaCambio(1)}
          disabled={paginaActual === 1}
          className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
          aria-label="Primera página"
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}

      {/* Botón página anterior */}
      <button
        onClick={() => onPaginaCambio(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
        aria-label="Página anterior"
        title="Página anterior (←)"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Números de página */}
      <div className="hidden sm:flex items-center gap-1">
        {paginas.map((pagina, index) => {
          if (pagina === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const numeroPagina = pagina as number;
          const esActual = numeroPagina === paginaActual;

          return (
            <button
              key={numeroPagina}
              onClick={() => onPaginaCambio(numeroPagina)}
              className={`min-w-[40px] px-3 py-2 rounded-md border transition-colors font-medium text-sm ${
                esActual
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-muted'
              }`}
              aria-label={`Página ${numeroPagina}`}
              aria-current={esActual ? 'page' : undefined}
            >
              {numeroPagina}
            </button>
          );
        })}
      </div>

      {/* Indicador móvil */}
      <div className="sm:hidden px-4 py-2 text-sm text-muted-foreground font-medium">
        {paginaActual} / {totalPaginas}
      </div>

      {/* Botón página siguiente */}
      <button
        onClick={() => onPaginaCambio(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
        aria-label="Página siguiente"
        title="Página siguiente (→)"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Botón última página */}
      {mostrarPrimeraUltima && (
        <button
          onClick={() => onPaginaCambio(totalPaginas)}
          disabled={paginaActual === totalPaginas}
          className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
};

export default React.memo(Paginacion);

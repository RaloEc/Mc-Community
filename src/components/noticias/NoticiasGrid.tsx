'use client';

import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { AnimatePresence, motion } from 'framer-motion';
import NoticiaCard from './NoticiaCard';
import { useNoticias, FiltroNoticias } from './hooks/useNoticias';
import AdBanner from '@/components/ads/AdBanner';
import AdRectangle from '@/components/ads/AdRectangle';

export interface NoticiasGridProps {
  initialFiltros?: FiltroNoticias;
  columnas?: 1 | 2 | 3;
  mostrarResumen?: boolean;
  limit?: number;
  className?: string;
  onCategoriasLoaded?: (categorias: any[]) => void;
}

const NoticiasGrid: React.FC<NoticiasGridProps> = ({
  initialFiltros = {},
  columnas = 3,
  mostrarResumen = true,
  limit = 16,
  className = '',
  onCategoriasLoaded = () => {}
}) => {
  // Estado para controlar si es la primera carga
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Referencia para detección de scroll para carga infinita
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Usar el hook personalizado para gestionar las noticias
  const {
    noticias,
    categorias,
    isLoading,
    isRefetching,
    isError,
    loadMoreNoticias,
    hasNextPage,
    isFetchingNextPage
  } = useNoticias(initialFiltros, limit);

  // Efecto para cargar más noticias cuando se llega al final de la lista
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      loadMoreNoticias();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadMoreNoticias]);

  // Efecto para notificar al componente padre sobre las categorías cargadas
  useEffect(() => {
    if (onCategoriasLoaded && categorias.length > 0) {
      onCategoriasLoaded(categorias);
    }
  }, [categorias, onCategoriasLoaded]);

  // Marcar que ya no es la primera carga cuando tengamos datos
  useEffect(() => {
    if (noticias.length > 0 && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [noticias, isFirstLoad]);

  // Definir el número de columnas según el prop
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1 max-w-4xl mx-auto',
    2: 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto',
  };

  // Función para insertar anuncios entre las noticias
  const insertarAnuncios = (items: any[]) => {
    if (items.length <= 3) return items;
    
    // Creamos una copia del array para no mutar el original
    const resultado = [...items];
    
    // Insertamos un marcador para un anuncio después de la tercera noticia
    resultado.splice(3, 0, { id: 'ad-1', esAnuncio: true });
    
    // Si hay más de 8 noticias, insertamos otro anuncio
    if (items.length > 8) {
      resultado.splice(8, 0, { id: 'ad-2', esAnuncio: true });
    }
    
    return resultado;
  };

  // Noticias con anuncios insertados
  const noticiasConAnuncios = insertarAnuncios(noticias);

  // Mostrar spinner de carga solo cuando es la primera carga
  if (isLoading && isFirstLoad) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Mostrar mensaje de error si hay un error
  if (isError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">No se pudieron cargar las noticias</span>
      </div>
    );
  }

  // Mostrar mensaje de "sin resultados" solo si no hay noticias y no está cargando
  if (noticias.length === 0 && !isLoading && !isRefetching) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron noticias con los filtros seleccionados.</p>
      </div>
    );
  }


  return (
    <div className={`w-full ${className}`}>
      {/* Indicador de carga sutil */}
      {(isLoading || isRefetching) && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span>Buscando noticias...</span>
          </div>
        </div>
      )}

      <div className={`grid ${gridCols[columnas]} gap-6 w-full transition-opacity duration-200 ${isRefetching && !isFirstLoad ? 'opacity-70' : 'opacity-100'}`}>
        <AnimatePresence mode="popLayout">
          {noticiasConAnuncios.map((item, index) => (
            item.esAnuncio ? (
              <motion.div 
                key={item.id}
                className="col-span-full flex justify-center my-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * Math.min(index, 6) }}
              >
                {item.id === 'ad-1' ? (
                  <AdBanner className="w-full max-w-4xl" />
                ) : (
                  <AdRectangle className="" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.1 * Math.min(index, 6),
                  ease: 'easeOut' 
                }}
                layout
              >
                <NoticiaCard 
                  noticia={item} 
                  mostrarResumen={mostrarResumen}
                />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Elemento para detectar cuando el usuario llega al final y cargar más noticias */}
      {hasNextPage && (
        <div ref={ref} className="w-full py-8 flex justify-center">
          {isFetchingNextPage ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          ) : (
            <span className="text-sm text-muted-foreground">Cargando más noticias...</span>
          )}
        </div>
      )}
    </div>
  );
};

export default NoticiasGrid;

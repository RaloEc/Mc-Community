'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Noticia } from '@/types';

interface NoticiasRelacionadasProps {
  noticias: Noticia[];
  isLoading?: boolean;
}

const NoticiasRelacionadas: React.FC<NoticiasRelacionadasProps> = ({ 
  noticias = [], 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mb-10">
        <h2 className="text-xl font-semibold mb-4">Noticias relacionadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (noticias.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mb-10">
      <h2 className="text-xl font-semibold mb-4">Noticias relacionadas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {noticias.map((noticia) => (
          <Link 
            href={`/noticias/${noticia.id}`} 
            key={noticia.id}
            className="group"
          >
            <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
              <div className="relative w-full aspect-video overflow-hidden">
                {(noticia.imagen_url || noticia.imagen_portada) ? (
                  <Image
                    src={noticia.imagen_url || noticia.imagen_portada || ''}
                    alt={noticia.titulo}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Sin imagen</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {noticia.titulo}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Memoizar el componente para evitar re-renderizados innecesarios
export default React.memo(NoticiasRelacionadas);

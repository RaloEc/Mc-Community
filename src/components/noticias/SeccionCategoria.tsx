'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface SeccionCategoriaProps {
  categoriaId: number | string;
  categoriaNombre: string;
  limite?: number;
}

const SeccionCategoria: React.FC<SeccionCategoriaProps> = ({ 
  categoriaId, 
  categoriaNombre, 
  limite = 4 
}) => {
  // Usar React Query para obtener las noticias de la categoría
  const { data: noticias, isLoading, isError } = useQuery({
    queryKey: ['noticias', 'categoria', categoriaId, limite],
    queryFn: async () => {
      try {
        // Usar URL absoluta para evitar problemas con Next.js
        let baseUrl;
        if (typeof window !== 'undefined') {
          baseUrl = window.location.origin;
        } else {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000');
        }
        
        const response = await fetch(`${baseUrl}/api/noticias?categoria=${categoriaId}&ordenFecha=desc&limit=${limite}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        } else {
          throw new Error(data.error || 'Error desconocido al obtener noticias');
        }
      } catch (err) {
        console.error(`Error al cargar noticias de categoría ${categoriaNombre}:`, err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !noticias || noticias.length === 0) {
    return null; // No mostrar la sección si hay error o no hay noticias
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{categoriaNombre}</h2>
        <Link 
          href={`/noticias?categoria=${encodeURIComponent(categoriaNombre)}`}
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
        >
          Ver todas <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {noticias.map(noticia => (
          <div key={noticia.id} className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow border border-border/50">
            <div className="relative h-32">
              <Image 
                src={noticia.imagen_portada || noticia.imagen_url || '/placeholder.jpg'} 
                alt={noticia.titulo}
                fill
                loading="lazy"
                className="object-cover"
              />
              {noticia.categorias && noticia.categorias.length > 0 && noticia.categorias[0].id !== categoriaId && (
                <div className="absolute top-2 left-2">
                  <Badge className="text-xs bg-primary/80 text-white">
                    {noticia.categorias[0].nombre}
                  </Badge>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold line-clamp-2 text-sm">
                <Link href={`/noticias/${noticia.id}`} className="hover:text-primary transition-colors">
                  {noticia.titulo}
                </Link>
              </h3>
              <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {new Date(noticia.fecha_publicacion || Date.now()).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </span>
                <span className="truncate max-w-[100px]" style={{ color: noticia.autor?.color || 'inherit' }}>
                  {noticia.autor?.username || noticia.autor_nombre || 'Anónimo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SeccionCategoria);

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarIcon } from 'lucide-react';
import { Noticia } from '@/types';

interface NoticiasMiniaturasProps {
  limit?: number;
  featured?: boolean;
}

export default function NoticiasMiniatura({ 
  limit = 2,
  featured = false 
}: NoticiasMiniaturasProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const fetchNoticias = async () => {
      try {
        setLoading(true);
        
        // Establecer un tiempo límite de 10 segundos para la carga
        const timeoutPromise = new Promise<Response>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Tiempo de espera agotado al cargar las noticias'));
          }, 10000); // 10 segundos
        });
        
        // Intentar obtener las noticias con un tiempo límite
        const response = await Promise.race([
          fetch('/api/noticias'),
          timeoutPromise
        ]) as Response;
        
        // Limpiar el timeout ya que la respuesta llegó
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar las noticias');
        }
        
        const data = await response.json();
        
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          if (data.success && data.data) {
            setNoticias(data.data.slice(0, limit));
          } else {
            setNoticias([]);
          }
        }
      } catch (err) {
        console.error('Error en NoticiasMiniatura:', err);
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar las noticias');
          setNoticias([]);
        }
      } finally {
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNoticias();
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [limit]);

  // Estado de carga
  if (loading) {
    return (
      <div className={`mt-2 ${featured ? 'grid md:grid-cols-3 gap-6' : 'space-y-3'}`}>
        {Array.from({ length: featured ? 3 : limit }).map((_, i) => (
          <div key={i} className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50 animate-pulse h-40">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Manejo de errores
  if (error) {
    return (
      <div className="mt-2">
        <div className="rounded-lg bg-red-500/10 p-3 dark:bg-red-900/10">
          <p className="text-sm text-red-500 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Sin noticias
  if (noticias.length === 0) {
    return (
      <div className="mt-2">
        <div className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
          <p className="text-sm text-muted-foreground">No hay noticias disponibles</p>
        </div>
      </div>
    );
  }

  // Vista principal
  if (featured) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {noticias.map((noticia) => (
          <Link
            key={noticia.id}
            href={`/noticias/${noticia.id}`}
            className="block group h-full"
          >
            <article className="h-full flex flex-col rounded-lg border border-border/50 overflow-hidden transition-all hover:shadow-md">
              {noticia.imagen_portada && (
                <div className="relative h-40">
                  <img
                    src={noticia.imagen_portada}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {noticia.fecha_publicacion && new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <h3 className="font-medium text-lg group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {noticia.titulo}
                </h3>
                <p className="mt-auto text-sm text-muted-foreground line-clamp-3">
                  {noticia.resumen || noticia.contenido?.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    );
  }

  // Vista de lista simple
  return (
    <div className="space-y-3">
      {noticias.map((noticia) => (
        <Link 
          key={noticia.id} 
          href={`/noticias/${noticia.id}`}
          className="block rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50 hover:bg-background dark:hover:bg-amoled-black transition-colors"
        >
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <CalendarIcon className="mr-1 h-3 w-3" />
            <time>
              {new Date(noticia.fecha_publicacion || noticia.created_at || Date.now()).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          <h4 className="font-medium text-foreground hover:text-primary transition-colors">
            {noticia.titulo}
          </h4>
        </Link>
      ))}
    </div>
  );
}

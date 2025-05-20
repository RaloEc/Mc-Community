'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Noticia } from '@/types';

export default function NoticiasDestacadas() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoticiasDestacadas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/noticias');
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Filtramos solo las noticias destacadas o las 3 más recientes si no hay destacadas
          const destacadas = data.data.filter((noticia: Noticia) => noticia.destacada);
          if (destacadas.length > 0) {
            setNoticias(destacadas.slice(0, 3));
          } else {
            setNoticias(data.data.slice(0, 3));
          }
        } else {
          throw new Error(data.error || 'Error desconocido al obtener noticias');
        }
      } catch (err) {
        console.error('Error al cargar noticias destacadas:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchNoticiasDestacadas();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Cargando noticias destacadas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No hay noticias destacadas disponibles.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((noticia) => (
          <article 
            key={noticia.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-amoled-gray"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <Image
                src={noticia.imagen_portada || 'https://placehold.co/600x400/1a1a1a/44bd32?text=Minecraft+News'}
                alt={noticia.titulo}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {noticia.destacada && (
                <Badge 
                  className="absolute top-4 left-4 z-20 bg-amber-600 hover:bg-amber-700 text-white border-none"
                  variant="default"
                >
                  Destacada
                </Badge>
              )}
              {noticia.categorias && noticia.categorias.length > 0 ? (
                <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-1 justify-end">
                  {noticia.categorias.map((cat) => (
                    <Badge 
                      key={cat.id}
                      className="text-xs bg-blue-900 hover:bg-blue-800 text-white border-none"
                      variant="default"
                    >
                      {cat.nombre}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge 
                  className="absolute top-4 right-4 z-20 bg-blue-900 hover:bg-blue-800 text-white border-none"
                  variant="default"
                >
                  General
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <time>
                  {new Date(noticia.fecha_publicacion || noticia.created_at || Date.now()).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <h2 className="text-xl font-semibold leading-none tracking-tight mt-2">
                {noticia.titulo}
              </h2>
              <p className="text-muted-foreground">
                {noticia.contenido ? noticia.contenido.substring(0, 150).replace(/<\/?[^>]+(>|$)/g, '') + '...' : ''}
              </p>
              <div className="pt-4 mt-auto">
                <Button 
                  variant="link" 
                  className="px-0 text-primary" 
                  asChild
                >
                  <Link href={`/noticias/${noticia.id}`}>
                    Leer más
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

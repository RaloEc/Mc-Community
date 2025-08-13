'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Noticia } from '@/types';

interface NoticiasGridProps {
  limit?: number;
  showTitle?: boolean;
  titleText?: string;
  descriptionText?: string;
}

export default function NoticiasGrid({
  limit = 9,
  showTitle = true,
  titleText = "Últimas Noticias",
  descriptionText = "Mantente al día con las últimas novedades del mundo de Minecraft"
}: NoticiasGridProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        setLoading(true);
        // Utilizamos la API Route que ya está configurada para obtener noticias
        const response = await fetch('/api/noticias');
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Limitamos el número de noticias según el prop
          setNoticias(data.data.slice(0, limit));
        } else {
          throw new Error(data.error || 'Error desconocido al obtener noticias');
        }
      } catch (err) {
        console.error('Error al cargar noticias:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchNoticias();
  }, [limit]);

  return (
    <div className="w-full">
      {showTitle && (
        <div className="space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {descriptionText}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando noticias...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : noticias.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
        </div>
      ) : (
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
                {noticia.categorias && noticia.categorias.length > 0 ? (
                  <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-1 justify-end">
                    {noticia.categorias.map((cat) => (
                      <Badge 
                        key={cat.id}
                        className="text-xs bg-blue-900 hover:bg-blue-800 text-primary-foreground border-none"
                        variant="default"
                      >
                        {cat.nombre}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge 
                    className="absolute top-4 right-4 z-20 bg-blue-900 hover:bg-blue-800 text-primary-foreground border-none"
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
      )}
    </div>
  );
}

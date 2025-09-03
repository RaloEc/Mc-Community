'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Clock, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  vistas: number;
  created_at: string;
  autor_nombre?: string;
  autor_color?: string;
  categorias?: {
    categoria: {
      nombre: string;
      slug: string;
      color: string;
    };
  }[];
}

interface NoticiasDestacadasProps {
  className?: string;
}

export default function NoticiasDestacadas({ className = '' }: NoticiasDestacadasProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const response = await fetch('/api/noticias?limit=3&tipo=destacadas');
        if (response.ok) {
          const data = await response.json();
          setNoticias(data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar noticias destacadas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticias();
  }, []);

  const getExcerpt = (contenido: string, maxLength: number = 120) => {
    const plainText = contenido.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Noticias Destacadas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-800" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Noticias Destacadas
        </h2>
        <Link href="/noticias">
          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Ver todas <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((noticia) => (
          <Link key={noticia.id} href={`/noticias/${noticia.id}`}>
            <article className="bg-white dark:bg-gray-900 dark:data-[theme=amoled]:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:scale-[1.02] group h-full flex flex-col">
              {/* Imagen */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 overflow-hidden">
                {noticia.imagen_url ? (
                  <img
                    src={noticia.imagen_url}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-600">
                      <div className="text-4xl mb-2">📰</div>
                      <div className="text-sm">Sin imagen</div>
                    </div>
                  </div>
                )}
                
                {/* Overlay con categoría */}
                {noticia.categorias && noticia.categorias.length > 0 && noticia.categorias[0]?.categoria && (
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/90 dark:bg-black/90 text-gray-900 dark:text-white backdrop-blur-sm"
                      style={{ 
                        borderLeft: `3px solid ${noticia.categorias[0].categoria.color || '#3b82f6'}` 
                      }}
                    >
                      {noticia.categorias[0].categoria.nombre || 'General'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {noticia.titulo}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                  {getExcerpt(noticia.contenido)}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mt-auto">
                  <div className="flex items-center gap-4">
                    {noticia.autor_nombre && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span 
                          className="font-medium"
                          style={{ color: noticia.autor_color || undefined }}
                        >
                          {noticia.autor_nombre}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(noticia.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{noticia.vistas}</span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

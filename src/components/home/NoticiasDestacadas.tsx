'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Clock, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NoticiaMetaInfo } from '../noticias/NoticiaMetaInfo';

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  vistas: number;
  created_at: string;
  autor_nombre?: string;
  autor_avatar?: string;
  autor_color?: string;
  votos?: number;
  comentarios_count?: number;
  mi_voto?: number | null;
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

  const getExcerpt = (text: string, length = 100) => {
    if (!text) return '';
    return text.length > length ? `${text.substring(0, length)}...` : text;
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
            <div key={i} className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-blue-900 dark:bg-gray-800 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
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
          <Button variant="ghost" size="sm" className="group text-foreground/70 hover:text-foreground transition-colors">
            Ver todas <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((noticia) => (
          <div key={noticia.id} className="relative group h-full">
            <Link href={`/noticias/${noticia.id}`} className="block h-full">
              {/* Contenedor principal con aspect ratio 16:9 */}
              <article className="relative aspect-[16/9] rounded-2xl overflow-hidden group">
                {/* Contenedor de la imagen */}
                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl">
                  {noticia.imagen_url ? (
                    <img
                      src={noticia.imagen_url}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-800 dark:from-blue-950/50 dark:to-blue-900/30 flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-600">
                        <div className="text-4xl mb-2">📰</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Título de la noticia - Se oculta al hacer hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm md:text-base">
                    {noticia.titulo}
                  </h3>
                </div>

                {/* Badge de visualizaciones */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    <Eye className="h-3 w-3" />
                    <span>{noticia.vistas}</span>
                  </div>
                </div>

                {/* Badge de categoría */}
                {noticia.categorias?.[0]?.categoria && (
                  <div className="absolute top-4 left-4">
                    <Badge
                      className="backdrop-blur-sm border-0 px-3 py-1 font-medium text-xs"
                      style={{
                        backgroundColor: `${noticia.categorias[0].categoria.color}20`,
                        color: noticia.categorias[0].categoria.color,
                        borderLeft: `3px solid ${noticia.categorias[0].categoria.color}`
                      }}
                    >
                      {noticia.categorias[0].categoria.nombre}
                    </Badge>
                  </div>
                )}

                {/* Opción 3: Zoom In con modo oscuro mejorado */}
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm p-5 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 flex flex-col dark:bg-opacity-80 overflow-hidden rounded-2xl">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                    {noticia.titulo}
                  </h3>

                  <div
                    className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: noticia.contenido
                        ? getExcerpt(noticia.contenido.replace(/<[^>]*>?/gm, ' '), 200)
                        : ''
                    }}
                  />

                  <NoticiaMetaInfo
                    autor_nombre={noticia.autor_nombre}
                    autor_avatar={noticia.autor_avatar}
                    created_at={noticia.created_at}
                    comentarios_count={noticia.comentarios_count}
                    className="mt-auto"
                  />
                </div>
              </article>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

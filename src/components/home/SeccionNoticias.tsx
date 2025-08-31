'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Clock, User, TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      color?: string;
    };
  }[];
}

interface SeccionNoticiasProps {
  className?: string;
}

export default function SeccionNoticias({ className = '' }: SeccionNoticiasProps) {
  const [noticias, setNoticias] = useState<{
    masVistas: Noticia[];
    ultimas: Noticia[];
    categoriaAleatoria: Noticia[];
  }>({
    masVistas: [],
    ultimas: [],
    categoriaAleatoria: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mas-vistas');

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const [masVistasRes, ultimasRes, categoriaRes] = await Promise.all([
          fetch('/api/noticias?limit=6&tipo=mas-vistas'),
          fetch('/api/noticias?limit=6&tipo=ultimas'),
          fetch('/api/noticias?limit=6&tipo=categoria-aleatoria')
        ]);

        const [masVistasData, ultimasData, categoriaData] = await Promise.all([
          masVistasRes.ok ? masVistasRes.json() : { items: [] },
          ultimasRes.ok ? ultimasRes.json() : { items: [] },
          categoriaRes.ok ? categoriaRes.json() : { items: [] }
        ]);

        setNoticias({
          masVistas: masVistasData.items || [],
          ultimas: ultimasData.items || [],
          categoriaAleatoria: categoriaData.items || []
        });
      } catch (error) {
        console.error('Error al cargar noticias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticias();
  }, []);

  const getExcerpt = (contenido: string, maxLength: number = 100) => {
    const plainText = contenido.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const NoticiaCard = ({ noticia }: { noticia: Noticia }) => (
    <Link href={`/noticias/${noticia.id}`}>
      <article className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200 hover:scale-[1.01] group">
        <div className="flex">
          {/* Imagen */}
          <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 overflow-hidden">
            {noticia.imagen_url ? (
              <img
                src={noticia.imagen_url}
                alt={noticia.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                <div className="text-2xl">📰</div>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {noticia.titulo}
              </h3>
              {noticia.categorias && noticia.categorias.length > 0 && noticia.categorias[0]?.categoria && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs"
                  style={{ 
                    borderLeft: `2px solid ${noticia.categorias[0].categoria.color || '#3b82f6'}` 
                  }}
                >
                  {noticia.categorias[0].categoria.nombre || 'General'}
                </Badge>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
              {getExcerpt(noticia.contenido)}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-3">
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
        </div>
      </article>
    </Link>
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Noticias
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="flex">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
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
          Noticias
        </h2>
        <Link href="/noticias">
          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Ver todas
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="mas-vistas" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Más Vistas</span>
            <span className="sm:hidden">Populares</span>
          </TabsTrigger>
          <TabsTrigger value="ultimas" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Últimas</span>
            <span className="sm:hidden">Recientes</span>
          </TabsTrigger>
          <TabsTrigger value="categoria" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Destacadas</span>
            <span className="sm:hidden">Destacadas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mas-vistas" className="mt-6">
          <div className="space-y-4">
            {noticias.masVistas.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ultimas" className="mt-6">
          <div className="space-y-4">
            {noticias.ultimas.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categoria" className="mt-6">
          <div className="space-y-4">
            {noticias.categoriaAleatoria.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

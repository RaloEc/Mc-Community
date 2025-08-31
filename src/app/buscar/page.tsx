'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Eye, Clock, User, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResultadoBusqueda {
  id: string;
  titulo: string;
  contenido: string;
  tipo: 'noticia' | 'hilo';
  created_at: string;
  vistas?: number;
  autor_nombre?: string;
  autor_color?: string;
  categoria?: {
    nombre: string;
    color: string;
  };
  imagen_url?: string;
}

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [resultados, setResultados] = useState<{
    noticias: ResultadoBusqueda[];
    hilos: ResultadoBusqueda[];
  }>({
    noticias: [],
    hilos: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    if (queryParam) {
      buscar(queryParam);
    }
  }, [queryParam]);

  const buscar = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const [noticiasRes, hilosRes] = await Promise.all([
        fetch(`/api/noticias?buscar=${encodeURIComponent(searchQuery)}&limit=20`),
        fetch(`/api/foro/hilos?buscar=${encodeURIComponent(searchQuery)}&limit=20`)
      ]);

      const [noticiasData, hilosData] = await Promise.all([
        noticiasRes.ok ? noticiasRes.json() : { items: [] },
        hilosRes.ok ? hilosRes.json() : { items: [] }
      ]);

      setResultados({
        noticias: (noticiasData.items || []).map((item: any) => ({ ...item, tipo: 'noticia' as const })),
        hilos: (hilosData.items || []).map((item: any) => ({ ...item, tipo: 'hilo' as const }))
      });
    } catch (error) {
      console.error('Error en la búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      buscar(query.trim());
      // Actualizar URL sin recargar la página
      window.history.pushState({}, '', `/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getExcerpt = (contenido: string, maxLength: number = 150) => {
    const plainText = contenido.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const ResultadoCard = ({ resultado }: { resultado: ResultadoBusqueda }) => (
    <Link href={resultado.tipo === 'noticia' ? `/noticias/${resultado.id}` : `/foro/hilo/${resultado.id}`}>
      <article className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200 hover:scale-[1.01] group">
        <div className="flex items-start gap-4">
          {/* Imagen o icono */}
          <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg overflow-hidden flex items-center justify-center">
            {resultado.imagen_url ? (
              <img
                src={resultado.imagen_url}
                alt={resultado.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl">
                {resultado.tipo === 'noticia' ? '📰' : '💬'}
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {resultado.titulo}
              </h3>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant={resultado.tipo === 'noticia' ? 'default' : 'secondary'}>
                  {resultado.tipo === 'noticia' ? 'Noticia' : 'Foro'}
                </Badge>
                {resultado.categoria && (
                  <Badge 
                    variant="outline"
                    style={{ borderColor: resultado.categoria.color }}
                  >
                    {resultado.categoria.nombre}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
              {getExcerpt(resultado.contenido)}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-4">
                {resultado.autor_nombre && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span 
                      className="font-medium"
                      style={{ color: resultado.autor_color || undefined }}
                    >
                      {resultado.autor_nombre}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(resultado.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </div>
              
              {resultado.vistas && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{resultado.vistas}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  const todosLosResultados = [...resultados.noticias, ...resultados.hilos];
  const totalResultados = todosLosResultados.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Barra de búsqueda */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Buscar noticias, hilos del foro..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-20 py-3 text-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </div>

        {/* Resultados */}
        {queryParam && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Resultados de búsqueda
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Buscando...' : `${totalResultados} resultados para "${queryParam}"`}
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 mb-6">
                <TabsTrigger value="todos" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Todos ({totalResultados})
                </TabsTrigger>
                <TabsTrigger value="noticias" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Noticias ({resultados.noticias.length})
                </TabsTrigger>
                <TabsTrigger value="foro" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Foro ({resultados.hilos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : todosLosResultados.length > 0 ? (
                  todosLosResultados.map((resultado) => (
                    <ResultadoCard key={`${resultado.tipo}-${resultado.id}`} resultado={resultado} />
                  ))
                ) : queryParam ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="noticias" className="space-y-4">
                {resultados.noticias.length > 0 ? (
                  resultados.noticias.map((resultado) => (
                    <ResultadoCard key={resultado.id} resultado={resultado} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📰</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No se encontraron noticias
                    </h3>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="foro" className="space-y-4">
                {resultados.hilos.length > 0 ? (
                  resultados.hilos.map((resultado) => (
                    <ResultadoCard key={resultado.id} resultado={resultado} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No se encontraron hilos del foro
                    </h3>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Estado inicial sin búsqueda */}
        {!queryParam && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Buscar en MC Community
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Encuentra noticias, hilos del foro y más contenido de la comunidad
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
